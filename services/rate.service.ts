import { load } from "@std/dotenv";
import { DOMParser } from "../deps.ts";
import DBService from "./db.service.ts";
import TelegramService, { TPayload } from "./telegram.service.ts";

class RateService {
  private url = "https://www.alfabank.by/exchange/digital/";
  private db: DBService;
  private isMock = false;

  private getMockRates = () => {
    const buy = 2 + Math.random() * 2;
    const sell = buy + Math.random() * (4 - buy);
    return {
      id: 1,
      buy_rate: Number(buy.toFixed(4)),
      sell_rate: Number(sell.toFixed(4)),
      created_at: new Date(),
    };
  };

  constructor() {
    this.db = new DBService();
  }

  fetchRates = async (): Promise<TPayload> => {
    const env = await load();
    const apiKey = env["apiKey"];
    const prevCourse = await this.db.getLatestRate();

    if (this.isMock) {
      const current = this.getMockRates();
      this.db.insertExchangeCourse(
        current.buy_rate,
        current.sell_rate,
      );
      return { current, prev: prevCourse };
    }
    try {
      const resp = await fetch(
        `https://anyapi.io/api/v1/scrape?apiKey=${apiKey}&url=${
          encodeURIComponent(
            this.url,
          )
        }`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

      const data = await resp.json();
      const html = data.content;
      const prices = this.parseExchangeRates(html) as any;
      this.db.insertExchangeCourse(prices.sell_rate, prices.buy_rate);
      return { prev: prevCourse, current: prices };
    } catch (error) {
      console.error("Error fetching rates:", error);
      throw error;
    }
  };

  refreshRates = async () => {
    try {
      const rates = await this.fetchRates();
      new TelegramService().sendExchangeCourse(rates);
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
  };

  private parseExchangeRates = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    const buyElement = doc.querySelector(".price__value span:first-child");
    const sellElement = doc.querySelectorAll(
      ".price__value span:first-child",
    )[1];

    if (!buyElement || !sellElement) {
      throw new Error("Could not find price elements in the HTML");
    }

    return {
      sell_rate: +sellElement.textContent.trim(),
      buy_rate: +buyElement.textContent.trim(),
    };
  };
}

export default RateService;
