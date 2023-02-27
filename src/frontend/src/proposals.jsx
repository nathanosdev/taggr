import {HeadBar, Loading, ButtonWithLoading, bigScreen, timeAgo, token, userList} from "./common";
import * as React from "react";
import {Content} from "./content";
import {loadFile, MAX_POST_SIZE_BYTES} from "./form";

const REPO="https://github.com/TaggrNetwork/taggr/commit";

export const Proposals = () => {
    const [users, setUsers] = React.useState(null);
    const [proposals, setProposals] = React.useState(null);
    const [page, setPage] = React.useState(0);
    const [noMoreData, setNoMoreData] = React.useState(false);
    const [showMask, toggleMask] = React.useState(false);
    const [binary, setBinary] = React.useState(null);
    const [commit, setCommit] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [status, setStatus] = React.useState("");

    const loadState = async () => {
        const props = await api.query("proposals", page);
        if (props.length == 0) {
            setNoMoreData(true);
        }
        const data = page == 0 ? props : (proposals || []).concat(props);
        setProposals(data);
        return data;
    };
    const loadUsers = async () => {
        const list = await api.query("balances");
        setUsers(list.reduce((acc, [p, _, id]) => {
            acc[p] = id;
            return acc;
        }, {}));
    };

    React.useEffect(() => { loadState(); loadUsers(); }, []);
    React.useEffect(() => { loadState(); }, [page]);

    const statusEmoji = status => { return {"Open": "✨", "Rejected": "🟥", "Cancelled": "❌", "Executed": "✅" }[status] };

    const vote = async adopted => {
        const prevStatus = proposals[0].status;
        const result = await api.call("vote_on_proposal", adopted);
        if ("Err" in result) {
            setStatus(`Error: ${result.Err}`);
            return;
        }
        const data = await loadState();
        const lastProposal = data[0];
        const newStatus = lastProposal.status;
        if (prevStatus == "Open" && newStatus == "Executed" && "Release" in lastProposal.payload) {
            const upgrader_id = backendCache.stats.upgrader_canister_id;
            if (!upgrader_id) {
                setStatus("The upgrader canister not found. Please check and try again!");
                return;
            }
            setStatus("Executing the upgrade...");
            let response = await api.exec_upgrade(upgrader_id);
            if ("Err" in response) {
                setStatus(`Error: ${response.Err}`);
                return;
            }
            setStatus("Finalizing the upgrade...");
            if (await api.call("finish_upgrade", lastProposal.payload.Release.hash)) {
                setStatus("Success!");
                await loadState();
            } else {
                setStatus("Upgrade execution failed.");
            }
        }
    };

    return <>
        <HeadBar title="Proposals" shareLink="proposals" menu={true}
            content={<div className="row_container">
                <ButtonWithLoading classNameArg="max_width_col" label="FUNDING" onClick={async () => {
                    let receiver = prompt("Enter the principal of the receiver.");
                    let amount = parseInt(prompt(`Enter the token amount (max. allowed amount is ${backendCache.config.max_funding_amount.toLocaleString()})`));
                    let description = prompt("Enter the proposal description.");
                    let response = await api.call("propose_funding", description, receiver, amount);
                    if ("Err" in response) {
                        alert(`Error: ${response.Err}`);
                    }
                    await loadState();
                }} />
                <ButtonWithLoading classNameArg="max_width_col" label="CONTROLLER" onClick={async () => {
                    if(!confirm("This proposal will add a new controller to the main canister! " +
                        "It is needed for emergency cases, when the upgrade mechanisms stops working due to a bug. " +
                        "Do you want to continue?")) return;
                    let controller = prompt("Enter the principal of the controller.");
                    let description = prompt("Enter the proposal description.");
                    let response = await api.call("propose_controller", description, controller);
                    if ("Err" in response) {
                        alert(`Error: ${response.Err}`);
                    }
                    await loadState();
                }} />
                <button className="max_width_col active" onClick={() => toggleMask(!showMask)}>RELEASE</button>
            </div>} />
        <div className="vertically_spaced">
            {!proposals && <Loading />}
            {showMask && <div className="spaced column_container monospace">
                <div className="row_container vcentered bottom_half_spaced">COMMIT<input type="text" className="monospace left_spaced max_width_col" onChange={async ev => { setCommit(ev.target.value); }} /></div>
                <div className="row_container vcentered bottom_half_spaced">BINARY<input type="file" className="monospace left_spaced max_width_col" onChange={async ev => {
                    const file = (ev.dataTransfer || ev.target).files[0];
                    const content = new Uint8Array(await loadFile(file));
                    if (content.byteLength > MAX_POST_SIZE_BYTES) {
                        alert(`Error: the binary cannot be larger than ${MAX_POST_SIZE_BYTES} bytes.`);
                        return;
                    }
                    setBinary(content);
                }} /></div>
                <div className="bottom_half_spaced monospace">DESCRIPTION</div>
                <textarea className="monospace bottom_spaced" rows={10} value={description} onChange={event => setDescription(event.target.value)}></textarea>
                {description && <Content value={description} preview={true} classNameArg="bottom_spaced framed" />}
                <ButtonWithLoading classNameArg="active" onClick={async () => {
                    if (!description || !binary) {
                        alert("Error: incomplete data.");
                        return;
                    }
                    const result = await api.propose_release(description, commit, binary);
                    if ("Err" in result) {
                        alert(`Error: ${result.Err}`);
                        return;
                    }
                    toggleMask(!showMask);
                    await loadState();
                }} label="SUBMIT" />
            </div>}
            {proposals && proposals.map((proposal, i) => {
                const voted = proposal.votes.some(vote => api._principalId == vote[0]);
                const adopted = proposal.votes.reduce((acc, [_, adopted, votes]) => adopted ? acc + votes : acc, 0);
                const rejected = proposal.votes.reduce((acc, [_, adopted, votes]) => !adopted ? acc + votes : acc, 0);
                const commit = proposal.payload.Release ? proposal.payload.Release.commit : null;
                return <div key={proposal.timestamp}
                    className={`stands_out column_container ${i > 0 ? "outdated" : ""}`}>
                    <div className="monospace bottom_half_spaced">TYPE: {Object.keys(proposal.payload)[0].toUpperCase()}</div>
                    <div className="monospace bottom_half_spaced">PROPOSER: <a href={`#/user/${proposal.proposer}`}>{`@${backendCache.users[proposal.proposer]}`}</a></div>
                    <div className="monospace bottom_half_spaced">DATE: {timeAgo(proposal.timestamp)}</div>
                    <div className="monospace bottom_spaced">STATUS: {statusEmoji(proposal.status)}&nbsp;
                        {i == 0 && status ? status : proposal.status.toUpperCase()}</div>
                    {"Release" in proposal.payload && <div className="monospace bottom_spaced">
                        {commit && <div className="row_container bottom_half_spaced">COMMIT:<a className="monospace left_spaced" href={`${REPO}/${commit}`}>{bigScreen() ? commit : commit.slice(0,8)}</a></div>}
                        <div className="row_container"><span>HASH:</span><code className="left_spaced monospace">{bigScreen() ? proposal.payload.Release.hash : proposal.payload.Release.hash.slice(0,8)}</code></div>
                    </div>}
                    {"SetController" in proposal.payload && <div className="monospace bottom_half_spaced">Principal: <code>{proposal.payload.SetController.principal}</code></div>}
                    {"Fund" in proposal.payload && <>
                        <div className="monospace bottom_half_spaced">Receiver: <code>{proposal.payload.Fund[0]}</code></div>
                        <div className="monospace bottom_half_spaced">Amount: <code>{proposal.payload.Fund[1].toLocaleString()}</code></div>
                    </>}
                    <Content value={proposal.description} classNameArg="bottom_spaced" />
                    {api._user && proposal.status == "Open" && !voted && <>
                        <div className="row_container">
                            <ButtonWithLoading onClick={() => vote(false)} classNameArg="max_width_col large_text" label="REJECT" />
                            <ButtonWithLoading onClick={() => vote(true)} classNameArg="max_width_col large_text" label="ADOPT" />
                        </div>
                    </>}
                    {(proposal.status != "Open" && proposal.votes.length > 0 || voted) && <>
                        <div className="monospace bottom_spaced">
                            EFFECTIVE VOTING POWER: <code>{token(proposal.voting_power)}</code>
                        </div>
                        <div className="monospace bottom_spaced">
                            <div className="bottom_half_spaced">ADOPTED: <b className={adopted > rejected ? "accent" : null}>{token(adopted)}</b> ({percentage(adopted, proposal.voting_power)} %)</div>
                            <div className="small_text">{users && userList(proposal.votes.filter(vote => vote[1]).map(vote => users[vote[0]]))}</div>
                        </div>
                        <div className="monospace bottom_spaced">
                            <div className="bottom_half_spaced">REJECTED: <b className={adopted < rejected ? "accent" : null}>{token(rejected)}</b> ({percentage(rejected, proposal.voting_power)} %)</div>
                            <div className="small_text">{users && userList(proposal.votes.filter(vote => !vote[1]).map(vote => users[vote[0]]))}</div>
                        </div>
                    </>}
                    {api._user && api._user.id == proposal.proposer && proposal.status == "Open" &&
                        <ButtonWithLoading onClick={async () => {
                            await api.call("cancel_proposal", adopted);
                            await loadState();
                        }} classNameArg="top_spaced max_width_col large_text" label="CANCEL" />}
                </div>;
            })}</div>
        {!noMoreData && <div style={{display:"flex", justifyContent: "center"}}>
            <ButtonWithLoading classNameArg="active" onClick={() => setPage(page + 1)} label="MORE" />
        </div>}
    </>;
}

const percentage = (n, supply) =>  Math.ceil(parseInt(n) / supply * 10000) / 100