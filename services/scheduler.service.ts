import RateService from "./rate.service.ts";

const TEST_CRON_SCHEDULE = "* * * * *";
// Реальное расписание (8:00, 11:00, 14:00, 17:00)
const PROD_CRON_SCHEDULE = "0 8,11,14,17 * * *";

class SchedulerService {
  private rateService = new RateService();

  constructor(testMode = false) {
    const schedule = testMode ? TEST_CRON_SCHEDULE : PROD_CRON_SCHEDULE;

    Deno.cron(
      "Check rates",
      schedule,
      async () => {
        try {
          await this.rateService.refreshRates();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error:`, error);
        }
      },
    );
  }
}

export default SchedulerService;
