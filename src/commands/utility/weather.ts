import { register } from '../index.js';

interface GeoResult {
  results?: {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
  }[];
}

interface ForecastResult {
  current?: {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
}

register({
  name: 'weather',
  description: 'Current weather for a city',
  category: 'utility',
  permission: 'anyone',
  usage: '.weather <city>',
  async run(ctx) {
    const city = ctx.args.join(' ');
    if (!city) {
      await ctx.reply('Usage: .weather <city>');
      return;
    }
    const g = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`,
    ).then((r) => r.json())) as GeoResult;
    const loc = g.results?.[0];
    if (!loc) {
      await ctx.reply(`No location found for "${city}".`);
      return;
    }
    const f = (await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code`,
    ).then((r) => r.json())) as ForecastResult;
    const c = f.current;
    if (!c) {
      await ctx.reply('Weather lookup failed.');
      return;
    }
    await ctx.reply(
      `*${loc.name}, ${loc.country}*\nTemp: ${c.temperature_2m}°C\nHumidity: ${c.relative_humidity_2m}%\nWind: ${c.wind_speed_10m} km/h`,
    );
  },
});
