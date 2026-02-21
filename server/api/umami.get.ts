export default defineEventHandler(async (event) => {
  const script = await $fetch("https://cloud.umami.is/script.js", {
    responseType: "text",
  });

  setHeader(event, "Content-Type", "application/javascript");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return script;
});
