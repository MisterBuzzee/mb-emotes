import { menu, notify, registerExport } from "@aicore-fivem/lib/client";
import { sleep } from "@aicore-fivem/lib/shared";
import { Locale } from "common";

interface EmoteProp {
  model: string;
  bone: number;
  placement: { x: number; y: number; z: number; rx: number; ry: number; rz: number } | null;
}
interface EmoteEntry {
  name: string;
  type: "anim" | "scenario";
  dict?: string;
  anim?: string;
  scenario?: string;
  label: string;
  prop?: EmoteProp | null;
}

const raw = LoadResourceFile(GetCurrentResourceName(), "data/emotes.json");
let emotes: EmoteEntry[] = [];
let currentProp: number | null = null;
try {
  const parsed = JSON.parse(raw ?? "[]");
  if (Array.isArray(parsed)) emotes = parsed;
} catch {
  emotes = [];
}

async function requestDict(dict: string): Promise<boolean> {
  RequestAnimDict(dict);
  let tries = 0;
  while (!HasAnimDictLoaded(dict) && tries < 100) {
    await sleep(10);
    tries += 1;
  }
  return HasAnimDictLoaded(dict);
}

function deleteProp() {
  if (currentProp && DoesEntityExist(currentProp)) {
    DeleteEntity(currentProp);
  }
  currentProp = null;
}

async function playEmote(name: string): Promise<boolean> {
  deleteProp();
  const entry = emotes.find((e) => e.name === name);
  if (!entry) {
    notify(Locale("EMOTE_NOT_FOUND"), "error");
    return false;
  }
  if (entry.type === "scenario" && entry.scenario) {
    TaskStartScenarioInPlace(PlayerPedId(), entry.scenario, 0, true);
    notify(Locale("EMOTE_PLAYED"), "success");
    return true;
  }
  if (!entry.dict || !entry.anim) {
    notify(Locale("EMOTE_NOT_FOUND"), "error");
    return false;
  }
  if (!(await requestDict(entry.dict))) {
    notify(`Dict not found: ${entry.dict}`, "error");
    return false;
  }
  TaskPlayAnim(PlayerPedId(), entry.dict, entry.anim, 8.0, -8.0, -1, 49, 0, false, false, false);

  // Attach prop if the emote has one.
  if (entry.prop) {
    const p = entry.prop;
    const hash = GetHashKey(p.model);
    RequestModel(hash);
    let tries = 0;
    while (!HasModelLoaded(hash) && tries < 100) {
      await sleep(10);
      tries += 1;
    }
    if (HasModelLoaded(hash)) {
      const ped = PlayerPedId();
      const obj = CreateObject(hash, 0, 0, 0, true, true, false);
      const bone = GetPedBoneIndex(ped, p.bone);
      const pl = p.placement ?? { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
      AttachEntityToEntity(obj, ped, bone, pl.x, pl.y, pl.z, pl.rx, pl.ry, pl.rz, true, true, false, true, 1, true);
      currentProp = obj;
      SetModelAsNoLongerNeeded(hash);
    }
  }

  notify(Locale("EMOTE_PLAYED"), "success");
  return true;
}

RegisterNuiCallback("playEmote", (data: unknown, cb: (v: unknown) => void) => {
  const name = (data as { name?: string } | undefined)?.name;
  if (name) void playEmote(name);
  SetNuiFocus(false, false);
  cb(true);
});

RegisterNuiCallback("close", (_data: unknown, cb: (v: unknown) => void) => {
  deleteProp();
  SetNuiFocus(false, false);
  cb(true);
});

onNet("mb-emotes:client:open", () => {
  notify(`Loaded ${emotes.length} emotes`, "info");
  SetNuiFocus(true, true);
  SendNUIMessage({ action: "open", emotes });
});

RegisterCommand("emotes", () => {
  notify(`Loaded ${emotes.length} emotes`, "info");
  SetNuiFocus(true, true);
  SendNUIMessage({ action: "open", emotes });
}, false);

RegisterCommand("emote", async (_src: number, args: string[]) => {
  const name = args[0];
  if (!name || name === "stop" || name === "c") {
    deleteProp();
    ClearPedTasks(PlayerPedId());
    notify(Locale("EMOTE_STOPPED"), "success");
    return;
  }
  await playEmote(name);
}, false);