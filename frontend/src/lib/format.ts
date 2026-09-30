export const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export const pp = (value: number, digits = 2) => {
  const v = value * 100;
  const rounded = Math.abs(v) < 10 ** -digits / 2 ? 0 : v;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(digits)} pp`;
};

export const num = (value: number, digits = 1) => value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
