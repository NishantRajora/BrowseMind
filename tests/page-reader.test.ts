import { extractPageContent } from "../src/content/page-reader";

describe("extractPageContent", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header>Header</header>
      <nav>Navigation</nav>
      <article id="main">
        <p>Hello world</p>
        <div style="display:none;">Hidden text</div>
      </article>
      <footer>Footer</footer>
      <script>var a=1;</script>
    `;
  });

  it("removes unwanted elements and hidden text", async () => {
    const txt = await extractPageContent();
    expect(txt).toContain("Hello world");
    expect(txt).not.toContain("Header");
    expect(txt).not.toContain("Navigation");
    expect(txt).not.toContain("Footer");
    expect(txt).not.toContain("Hidden text");
  });

  it("truncates to maxText characters", async () => {
    const longStr = "a".repeat(50000);
    document.body.innerHTML = `<p>${longStr}</p>`;
    const txt = await extractPageContent();
    expect(txt.length).toBeLessThanOrEqual(30000);
  });
});
