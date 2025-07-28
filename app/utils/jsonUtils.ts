export type JSON = {
 [key: string]: any
}

export function deHydrateJSONString(data: string): JSON {
  let parsedData = {};
  try{
      parsedData = JSON.parse(data);
  }
  catch(e){
      if (e instanceof SyntaxError) {
          console.error("Invalid JSON:", e.message);
      } else {
          console.error("Unknown error:", e);
      }
  }
  return parsedData;
}