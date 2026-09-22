import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePath = "C:\\Users\\ADITYA\\Downloads\\JAL_SETU_v2.pptx";
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const snapshot = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 24000,
});
console.log(snapshot.ndjson);
