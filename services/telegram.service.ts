import { load } from "@std/dotenv";
import { ExchangeRate } from "./db.service.ts";

export type TPayload = { prev: ExchangeRate; current: ExchangeRate };

const formatCurrency = (value: number) => value.toFixed(2).replace(".", ",");

class TelegramService {
  private getArrow(change: number) {
    return change > 0 ? "▲" : change < 0 ? "▼" : "▬";
  }

  private buildMessage(prev: ExchangeRate, current: ExchangeRate) {
    const buyChange = current.buy_rate - +prev.buy_rate;
    const sellChange = current.sell_rate - +prev.sell_rate;

    return `
🔄 *ОБНОВЛЕНИЕ КУРСА ВАЛЮТ* 🔄

📅 Дата: ${new Date().toLocaleDateString("ru-RU")}
⏰ Время: ${
      new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

━━━━━━━━━━━━━━━━━━
💵 *ТЕКУЩИЙ КУРС*
├ Покупка: ${formatCurrency(current.buy_rate)} ₽ ${this.getArrow(buyChange)}
└ Продажа: ${formatCurrency(current.sell_rate)} ₽ ${this.getArrow(sellChange)}

━━━━━━━━━━━━━━━━━━
📈 *ИЗМЕНЕНИЯ ЗА ПЕРИОД*
├ Покупка: ${buyChange >= 0 ? "+" : ""}${formatCurrency(buyChange)}
│   Было: ${formatCurrency(+prev.buy_rate)}
└ Продажа: ${sellChange >= 0 ? "+" : ""}${formatCurrency(sellChange)}
    Было: ${formatCurrency(+prev.sell_rate)}

━━━━━━━━━━━━━━━━━━
💡 *РЕКОМЕНДАЦИЯ*
${this.getRecommendation(buyChange, sellChange)}
    `.trim();
  }

  private getRecommendation(buyChange: number, sellChange: number) {
    if (buyChange > 0.5) return "▶️ Выгодно покупать сейчас";
    if (sellChange < -0.3) return "⏏️ Рекомендуем продавать";
    return "⏸️ Сохраняйте текущую позицию";
  }

  sendExchangeCourse = async ({ prev, current }: TPayload) => {
    const env = await load();
    const { tgKey, tgChatId } = env;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${tgKey}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: this.buildMessage(prev, current),
          }),
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Ошибка отправки:", error);
      return { ok: false };
    }
  };
}

export default TelegramService;
