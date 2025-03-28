import EmailService from "./services/telegram.service.ts";
import rateService from "./services/rate.service.ts";

Deno.serve(async (_req) => {
  try {
    const rates = await rateService.fetchRates();
    new EmailService().sendExchangeCourse(rates);
    return new Response(JSON.stringify(rates), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch rates",
        details: error,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
