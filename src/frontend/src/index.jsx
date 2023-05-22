import * as React from "react";
import { AuthClient } from "@dfinity/auth-client"
import { Ed25519KeyIdentity } from "@dfinity/identity"
import { createRoot } from 'react-dom/client';
import { Post, postDataProvider } from "./post";
import { LoginMasks } from "./logins";
import { PostFeed } from "./post_feed";
import { Feed } from "./feed";
import { Thread } from "./thread";
import { Invites } from "./invites";
import { Inbox } from "./inbox";
import { Journal } from "./journal";
import { RealmForm, Realms, RealmPage } from "./realms";
import { Dashboard } from "./dashboard";
import { PostSubmissionForm } from "./new";
import { Profile } from './profile';
import { Landing } from './landing';
import { Header } from './header';
import { Unauthorized, microSecsSince, HeadBar, setTitle } from './common';
import { Settings } from './settings';
import { Api } from "./api";
import { Wallet } from "./wallet";
import { applyTheme, themes } from "./theme";
import {Proposals} from "./proposals";
import {Tokens, Transaction} from "./tokens";
import {Whitepaper} from "./whitepaper";
import {Recovery} from "./recovery";
import {MAINNET_MODE, CANISTER_ID} from './env';

const { hash, pathname } = location;

if (!hash && pathname != "/") {
    location.href = `#${pathname}`;
}

const REFRESH_RATE_SECS = 10 * 60;

const parseHash = () => {
    const parts = window.location.hash.replace("#", "").split("/");
    parts.shift();
    return parts;
};

const headerRoot = createRoot(document.getElementById("header"));
const stack = document.getElementById("stack");

const renderFrame = content => {
    const frames = Array.from(stack.children);
    frames.forEach(e => e.style.display = "none");
    const currentFrame = frames[frames.length-1];
    const lastFrame = frames[frames.length-2]

    // This resets the stack.
    if (location.hash == "#/home") {
        frames.forEach(frame => frame.remove());
        location.href = "#/";
        return;
    } else if (lastFrame && lastFrame.dataset.hash == location.hash) {
        currentFrame.remove();
        lastFrame.style.display = "block";
        return;
    } else if (currentFrame && currentFrame.dataset.hash == location.hash) {
        currentFrame.remove()
    }

    let frame = document.createElement("div");
    frame.dataset.hash = location.hash;
    stack.appendChild(frame);
    createRoot(frame).render(content);
}

const App = () => {
    window.lastActivity = new Date();
    const api = window.api;
    const auth = content => api._principalId ? content : <Unauthorized />;
    const [handler = "", param, param2] = parseHash();
    const heartbeat = (new Date()).toTimeString();
    let subtle = false;
    let inboxMode = false;
    let content = null;

    setTitle(handler);

    if (handler == "settings") {
        content = auth(<Settings />);
    } else if (handler == "whitepaper" || handler == "about") {
        content = <Whitepaper />;
    } else if (handler == "dashboard" || handler == "stats") {
        content = <Dashboard fullMode={true} />;
    } else if (handler == "welcome") {
        content = api._principalId 
            ? <Settings invite={param} />
            : <article className="text_centered">
                <h1>Welcome to {backendCache.config.name}!</h1>
                <h3>You were invited!</h3>
                <span className="larger_text">Please login and create your profile.</span>
                <hr />
                <LoginMasks />
            </article>;
    } else if (handler == "wallet" || (api._principalId && !api._user)) {
        content = <Wallet />;
    } else if (handler == "post") {
        const id = parseInt(param);
        const version = parseInt(param2);
        subtle = true;
        content = <Post id={id} data={postDataProvider(id)} version={version} />;
    } else if (handler == "edit") {
        const id = parseInt(param);
        content = auth(<PostSubmissionForm id={id} />);
    } else if (handler == "new") {
        subtle = true;
        content = auth(<PostSubmissionForm repost={parseInt(param2)} />);
    } else if (handler == "realm" || handler == "realms") {
        const name = param;
        const action = param2;
        if (action) content = auth(<RealmForm existingName={name.toUpperCase()} />);
        else if (!name) content = <Realms />;
        else content = <RealmPage name={decodeURI(name.toUpperCase())} />;
    } else if (handler == "inbox") {
        content = auth(<Inbox />);
        inboxMode = true;
    } else if (handler == "transaction") {
        content = <Transaction id={parseInt(param)} />;
    } else if (handler == "proposals") {
        content = <Proposals />
    } else if (handler == "tokens") {
        content = <Tokens />
    } else if (handler == "bookmarks") {
        content = auth(<PostFeed title={<HeadBar title="Bookmarks" shareLink="bookmarks" />} includeComments={true}
            feedLoader={async () => await api.query("posts", api._user.bookmarks) } />);
    } else if (handler == "invites") {
        content = auth(<Invites />);
    } else if (handler == "feed") {
        const params = param.split(/\+/).map(decodeURIComponent);
        content = <Feed heartbeat={heartbeat} params={params} />;
    } else if (handler == "thread") {
        content = <Thread heartbeat={heartbeat} id={parseInt(param)} />;
    } else if (handler == "user") {
        setTitle(`profile: @${param}`);
        content = <Profile handle={param} />;
    } else if (handler == "journal") {
        setTitle(`${param}'s journal`);
        subtle = true;
        content = <Journal handle={param} />;
    } else if (handler == "recovery") {
        content = <Recovery />;
    } else {
        content = <Landing heartbeat={heartbeat} />;
    }

    headerRoot.render(<React.StrictMode><Header subtle={subtle} inboxMode={inboxMode} user={api._user} route={window.location.hash} /></React.StrictMode>);
    renderFrame(<React.StrictMode>{content}</React.StrictMode>);
}

const reloadCache = async () => {
    window.backendCache = window.backendCache || { users: [], recent_tags: [] };
    const [users, recent_tags, stats, config, realms] = await Promise.all([
        window.api.query("users"), 
        window.api.query("recent_tags", 500), 
        window.api.query("stats"),
        window.api.query("config"),
        window.api.query("realms_data"),
    ]);
    console.log( "users", JSON.stringify(users).length / 1024 );
    console.log( "recent_tags", JSON.stringify(recent_tags).length / 1024 );
    console.log( "stats", JSON.stringify(stats).length / 1024 );
    console.log( "config", JSON.stringify(config).length / 1024 );
    console.log( "realms", JSON.stringify(realms).length / 1024 );
    window.backendCache = {
        users: users.reduce((acc, [id, name]) => { acc[id] = name; return acc }, {}),
        karma: users.reduce((acc, [id, _, karma]) => { acc[id] = karma; return acc }, {}),
        recent_tags: recent_tags.map(([tag, _]) => tag),
        realms: realms.reduce((acc, [name, color, controller]) => { acc[name] = [color, controller]; return acc }, {}),
        stats, config,
    };
    if (window.lastSavedUpgrade == 0) {
        window.lastSavedUpgrade = backendCache.stats.last_upgrade;
    } else if (lastSavedUpgrade != backendCache.stats.last_upgrade) {
        window.lastSavedUpgrade = backendCache.stats.last_upgrade;
        const banner = document.getElementById("upgrade_banner");
        banner.innerHTML = "New app version is available! Click me to reload.";
        banner.onclick = () => {
            banner.innerHTML = "RELOADING..."
            setTimeout(() => location.reload(), 100);
        };
        banner.style.display = "block";
    }
};

AuthClient.create({ idleOptions: { disableIdle: true } }).then(async (authClient) => {
    window.lastSavedUpgrade = 0;
    window.authClient = authClient;
    let identity = undefined;
    if (await authClient.isAuthenticated()) {
        identity = authClient.getIdentity();
    } else if (localStorage.getItem("IDENTITY")) {
        const serializedIdentity = localStorage.getItem("IDENTITY");
        if (serializedIdentity) {
            identity = Ed25519KeyIdentity.fromJSON(serializedIdentity);
        }
    } else {
        const hash = localStorage.getItem("IDENTITY_DEPRECATED");
        if (hash) {
            identity = Ed25519KeyIdentity.generate((new TextEncoder()).encode(hash).slice(0, 32));
        }
    }
    const api = Api(CANISTER_ID, identity, MAINNET_MODE);
    if (identity) api._principalId = identity.getPrincipal().toString();
    api._last_visit = 0;
    window.api = api;
    window.mainnet_api = Api(CANISTER_ID, identity, true);
    window.reloadCache = reloadCache;
    await reloadCache();

    if (api) {
        api._reloadUser = async () => {
            let data  = await api.query("user", []);
            if (data) {
                api._user = data;
                let realmNames = Object.keys(backendCache.realms);
                api._user.realms.sort((a, b) => realmNames.indexOf(a) - realmNames.indexOf(b));
                api._user.settings = JSON.parse(api._user.settings || "{}");
                if (600000 < microSecsSince(api._user.last_activity)) {
                    api._last_visit = api._user.last_activity;
                    api.call("update_last_activity");
                } else if (api._last_visit == 0) api._last_visit = api._user.last_activity;
                if (data.current_realm) {
                    const result = await api.query("realm", data.current_realm);
                    let realmTheme = result.Ok?.theme;
                    if (realmTheme) {
                        applyTheme(JSON.parse(realmTheme));
                        return;
                    }
                }
                applyTheme(themes[api._user.settings.theme]);
            } else applyTheme();
        };
        setInterval(async () => { 
            await api._reloadUser();
            await reloadCache();
            if (new Date() - window.lastActivity < REFRESH_RATE_SECS * 1000) return;
            App();
        }, REFRESH_RATE_SECS * 1000);
        await api._reloadUser();
    }
    updateDoc();
    App();
});

const updateDoc = () => {
    const container = document.getElementById("logo_container");
    container.remove();
    const scroll_up_button = document.createElement("div");
    scroll_up_button.id = "scroll_up_button";
    scroll_up_button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-arrow-up-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg>`;
    document.body.appendChild(scroll_up_button)
    window.scrollUpButton = document.getElementById("scroll_up_button");
    window.scrollUpButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollUpButton.className = "clickable action";
    window.addEventListener('scroll', () => { 
        lastActivity = new Date();
        window.scrollUpButton.style.display = window.scrollY > 1500 ? "flex" : "none";
    });
    window.addEventListener('keyup', () => { 
        lastActivity = new Date();
        window.scrollUpButton.style.display = "none";
    });
    window.addEventListener('popstate', App);
}
