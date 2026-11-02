import { addCommand, resourceExport } from "@aicore-fivem/lib/server";
import { createLogger } from "@aicore-fivem/lib/shared";

const log = createLogger("mb-emotes");
const core = resourceExport("ai-core");

addCommand("emotes", { help: "Open the emote menu", restricted: false }, (source) => {
  emitNet("mb-emotes:client:open", source);
});

log.info("mb-emotes ready");