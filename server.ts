import RateService from "./services/rate.service.ts";
import SchedulerService from "./services/scheduler.service.ts";

const rateService = new RateService();

new SchedulerService(false);

Deno.serve((_req) => {
  rateService.refreshRates();
  return new Response("Refreshing rates");
});
