import RateService from "./services/rate.service.ts";

Deno.serve((_req) => {
  RateService.refreshRates();
  return new Response("Refreshing rates");
});
