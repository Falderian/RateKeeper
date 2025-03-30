import RateService from "./services/rate.service.ts";
import "./services/scheduler.service.ts";

const rateService = new RateService();

Deno.serve((_req) => {
  rateService.refreshRates();
  return new Response("Refreshing rates");
});
