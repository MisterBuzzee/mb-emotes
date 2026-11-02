import { menu, notify, registerExport } from "@aicore-fivem/lib/client";
import { sleep } from "@aicore-fivem/lib/shared";
import { Locale } from "common";

interface EmoteEntry {
  name: string;
  type: "anim" | "scenario";
  dict?: string;
  anim?: string;
  scenario?: string;
  label: string;
}

const raw = LoadResourceFile(GetCurrentResourceName(), "data/emotes.json");
let emotes: EmoteEntry[] = [];
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

async function playEmote(name: string): Promise<boolean> {
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
  if (!name) {
    notify("Usage: /emote <name>", "info");
    return;
  }
  await playEmote(name);
}, false);