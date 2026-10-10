import { inspectMp4Codec } from "../lib/mp4Codec";

self.onmessage = async (event: MessageEvent<File>) => {
    const codec = await inspectMp4Codec(event.data);
    self.postMessage(codec);
};
