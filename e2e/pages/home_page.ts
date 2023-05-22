import { Locator, Page } from "@playwright/test";
import { InternetIdentityPage } from "./internet_identity_page";
import { NewPostPage } from "./new_post_page";

export class HomePage {
  public readonly welcomeAboardHeader: Locator;
  public readonly connectButton: Locator;
  private readonly loginWithInternetIdentityButton: Locator;
  private readonly loginWithSeedPhraseButton: Locator;
  private readonly seedPhraseInput: Locator;
  private readonly seedPhraseJoinButton: Locator;
  private readonly postButton: Locator;
  private readonly newPostsTab: Locator;
  private readonly postArticles: Locator;

  constructor(private readonly page: Page) {
    this.welcomeAboardHeader = page.locator("h1");
    this.connectButton = page.locator("button", {
      hasText: "CONNECT",
    });
    this.loginWithInternetIdentityButton = page.locator("button", {
      hasText: "VIA INTERNET IDENTITY",
    });
    this.loginWithSeedPhraseButton = page.locator("button", {
      hasText: "VIA PASSWORD",
    });
    this.seedPhraseInput = page.getByPlaceholder("Enter your password");
    this.seedPhraseJoinButton = page.locator("button", { hasText: "JOIN" });
    this.postButton = page.locator("button", { hasText: "POST" });
    this.newPostsTab = page.locator("button", { hasText: "NEW" });
    this.postArticles = page.getByRole("article");
  }

  public async goto(): Promise<void> {
    await this.page.goto("/#/");
  }

  public async openInternetIdentityLoginPage(): Promise<InternetIdentityPage> {
    await this.connectButton.click();

    const [internetIdentityPopup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.loginWithInternetIdentityButton.click(),
    ]);

    return new InternetIdentityPage(internetIdentityPopup);
  }

  public async loginWithSeedPhrase(seedPhrase: string): Promise<void> {
    await this.connectButton.click();
    await this.loginWithSeedPhraseButton.click();

    await this.seedPhraseInput.fill(seedPhrase);
    await this.seedPhraseJoinButton.click();

    // confirm seed phrase
    await this.seedPhraseInput.fill(seedPhrase);
    await this.seedPhraseJoinButton.click();
  }

  public async createPost(): Promise<NewPostPage> {
    await this.postButton.click();

    return new NewPostPage(this.page);
  }

  public async showNewPosts(): Promise<void> {
    await this.newPostsTab.click();
  }

  public async getPostByContent(content: string): Promise<Locator> {
    return this.postArticles.filter({ hasText: content });
  }
}
