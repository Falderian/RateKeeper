import { load } from "@std/dotenv";
import { DOMParser } from "../deps.ts";
class RateService {
  private url = "https://www.alfabank.by/exchange/digital/";
  private isMock = true;

  private mockRates() {
    return {
      buyRate: "3.0700",
      sellRate: "3.1220",
      lastUpdated: new Date().toISOString(),
      isMock: true,
    };
  }

  async fetchRates() {
    const env = await load();
    const apiKey = env["apiKey"];
    console.log(apiKey);
    if (this.isMock) return this.mockRates();
    try {
      const resp = await fetch(
        `https://anyapi.io/api/v1/scrape?apiKey=${apiKey}&url=${encodeURIComponent(
          this.url
        )}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

      const data = await resp.json();
      const html = data.content;

      const prices = this.parseExchangeRates(html);

      return prices;
    } catch (error) {
      console.error("Error fetching rates:", error);
      throw error;
    }
  }

  private parseExchangeRates(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    const buyElement = doc.querySelector(".price__value span:first-child");
    const sellElement = doc.querySelectorAll(
      ".price__value span:first-child"
    )[1];

    if (!buyElement || !sellElement) {
      throw new Error("Could not find price elements in the HTML");
    }

    return {
      buyRate: buyElement.textContent.trim(),
      sellRate: sellElement.textContent.trim(),
    };
  }
}

export default new RateService();
