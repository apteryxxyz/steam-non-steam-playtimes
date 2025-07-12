class Logger {
  #resetStyle = 'background: transparent;';
  #badgeText: string;

  constructor(badgeText: string) {
    this.#badgeText = badgeText;
  }

  get #badgeStyle() {
    const hash = [...this.#badgeText] //
      .reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
    const hex = `#${(hash & 0xffffff).toString(16).padStart(6, '0')}`;
    return `background: ${hex}; color: white;`;
  }

  #log(log: typeof console.log, ...args: unknown[]) {
    log(
      `%c ${this.#badgeText} %c`,
      this.#badgeStyle,
      this.#resetStyle,
      ...args,
    );
  }

  debug(...args: unknown[]) {
    this.#log(console.debug, ...args);
  }

  info(...args: unknown[]) {
    this.#log(console.info, ...args);
  }
}

export default new Logger('Non-Steam Playtimes');
