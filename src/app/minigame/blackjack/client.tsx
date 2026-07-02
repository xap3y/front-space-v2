"use client";

import React, { useEffect, useState } from "react";

// Types matching server payloads
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Card = { suit: Suit; rank: Rank; id: string };

type ServerGameState = {
    phase: "waiting" | "betting" | "dealing" | "playerTurn" | "dealerTurn" | "roundEnd";
    message: string;
    dealerCards: Card[];
    dealerScore: { total: number; soft: boolean };
    revealDealer: boolean;
    isHost: boolean;
    players: {
        nickname: string;
        isMe: boolean;
        bankroll: number;
        hands: {
            cards: Card[];
            score: { total: number; soft: boolean };
            bet: number;
            result: string | null;
            isDone: boolean;
        }[];
        activeHandIndex: number;
    }[];
};

const API_URL = "http://localhost:8012/v1/minigame/blackjack";
const WS_URL = "ws://localhost:8012/v1/minigame/blackjack/ws";

// Helpers
function formatCurrency(n: number) {
    if (!n) return "$0";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function BlackJackMultiplayer() {
    const [appState, setAppState] = useState<"menu" | "waiting" | "playing">("menu");
    const [code, setCode] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");

    const [ws, setWs] = useState<WebSocket | null>(null);
    const [gameState, setGameState] = useState<ServerGameState | null>(null);
    const [localBet, setLocalBet] = useState(10);
    const [copied, setCopied] = useState(false);

    // Watch for phase changes to transition from Waiting Room to Table
    useEffect(() => {
        if (gameState?.phase && gameState.phase !== "waiting" && appState === "waiting") {
            setAppState("playing");
        }
    }, [gameState?.phase, appState]);

    const handleCreateLobby = async () => {
        if (!nickname) { setError("Nickname is required to create a lobby."); return; }
        try {
            const res = await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname })
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setCode(data.code);
            connectWebSocket(data.code, data.token);
        } catch (e) {
            setError("Failed to create lobby.");
        }
    };

    const handleJoinLobby = async () => {
        if (!code || !nickname) { setError("Code and nickname required."); return; }
        try {
            const res = await fetch(`${API_URL}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, nickname })
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            connectWebSocket(data.code, data.token);
        } catch (e) {
            setError("Failed to join lobby.");
        }
    };

    const connectWebSocket = (lobbyCode: string, token: string) => {
        const socket = new WebSocket(`${WS_URL}?code=${lobbyCode}&token=${token}`);

        socket.onopen = () => {
            setAppState("waiting");
            setWs(socket);
            setError("");
        };

        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type === "GAME_STATE") {
                setGameState(payload.state);
            }
        };

        socket.onclose = () => {
            setAppState("menu");
            setError("Disconnected from server.");
            setWs(null);
            setGameState(null);
        };
    };

    const sendAction = (action: string, payload: any = {}) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action, ...payload }));
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- PHASE 1: MENU ---
    if (appState === "menu") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-neutral-200 p-4 font-sans">
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-sm w-full space-y-6 shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-emerald-400">Blackjack</h1>
                    {error && <div className="text-sm text-red-400 text-center bg-red-400/10 p-2 rounded">{error}</div>}

                    <div className="space-y-3">
                        <label className="text-xs uppercase text-neutral-500 font-semibold block">Your Nickname</label>
                        <input
                            type="text"
                            placeholder="Enter nickname..."
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />
                    </div>

                    <button onClick={handleCreateLobby} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors">
                        Create New Lobby
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-neutral-800"></div>
                        <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs uppercase font-bold">or join existing</span>
                        <div className="flex-grow border-t border-neutral-800"></div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Game Code"
                            maxLength={3}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button onClick={handleJoinLobby} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white font-bold px-6 rounded-lg transition-colors">
                            Join
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- PHASE 2: WAITING ROOM ---
    if (appState === "waiting") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-neutral-200 p-4 font-sans">
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                    <h2 className="text-sm uppercase text-neutral-500 font-bold text-center mb-2">Waiting Room</h2>
                    <h1 className="text-3xl font-bold text-center text-white mb-8">Lobby Code</h1>

                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="bg-neutral-950 border border-neutral-700 px-8 py-4 rounded-xl text-4xl font-mono text-emerald-400 font-black tracking-widest">
                            {code}
                        </div>
                        <button
                            onClick={copyCode}
                            className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 p-4 rounded-xl transition-colors flex items-center justify-center"
                            title="Copy Code"
                        >
                            {copied ? "✓" : "📋"}
                        </button>
                    </div>

                    <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 mb-8">
                        <h3 className="text-xs uppercase text-neutral-500 font-bold mb-3">Players Connected ({gameState?.players.length || 1})</h3>
                        <div className="space-y-2">
                            {gameState?.players.map((p, i) => (
                                <div key={i} className="flex justify-between items-center bg-neutral-900 px-3 py-2 rounded">
                                    <span className="font-semibold text-sm">{p.nickname} {p.isMe && "(You)"}</span>
                                    <span className="text-xs text-neutral-500">Ready</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {gameState?.isHost ? (
                        <button
                            onClick={() => sendAction("START_GAME")}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Start Game
                        </button>
                    ) : (
                        <div className="text-center text-neutral-500 text-sm animate-pulse">
                            Waiting for host to start the game...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- PHASE 3: PLAYING (Table) ---
    if (!gameState) return null;
    const me = gameState.players.find(p => p.isMe);
    const isActive = gameState.phase === "playerTurn" || gameState.phase === "dealing";

    return (
        <div className="text-neutral-200 font-sans selection:bg-emerald-500/30 xl:pb-0 pb-24 p-4 min-h-screen">
            <header className="mb-6 mx-auto max-w-6xl flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Code: <span className="text-emerald-400">{code}</span></h1>
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400">
                    {formatCurrency(me?.bankroll || 0)}
                </div>
            </header>

            <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

                {/* --- Game Table Area --- */}
                <div className="rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-b from-[#0d5c2e] via-[#0a4a25] to-[#07381c] border border-emerald-900">
                    <div className="p-6">
                        {/* Dealer Area */}
                        <div className="mb-8 flex flex-col items-center">
                            <span className="text-xs uppercase text-emerald-200/60 font-semibold mb-2 block tracking-widest">Dealer</span>
                            <div className="flex gap-2 min-h-[120px]">
                                {gameState.dealerCards.map((card, i) => (
                                    <div key={i} className={`w-20 h-28 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : ''}`}>
                                        {card.id === "hidden" ? "🂠" : `${card.rank}${card.suit}`}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Player Area */}
                        <div className="flex flex-col items-center mt-12">
                            <span className="text-xs uppercase text-emerald-200/60 font-semibold mb-2 block tracking-widest">{me?.nickname}</span>
                            <div className="flex gap-4">
                                {me?.hands.map((hand, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${idx === me.activeHandIndex && gameState.phase === 'playerTurn' ? 'border-emerald-400 bg-emerald-900/30' : 'border-emerald-300/10 bg-black/15'}`}>
                                        <div className="text-xs text-neutral-400 mb-2 font-mono flex justify-between">
                                            <span>Bet: {formatCurrency(hand.bet)}</span>
                                            {hand.result !== "pending" && <span className="uppercase text-amber-400 font-bold">{hand.result}</span>}
                                        </div>
                                        <div className="flex gap-2 min-h-[120px]">
                                            {hand.cards.map((card, i) => (
                                                <div key={i} className={`w-20 h-28 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl shadow-lg ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : ''}`}>
                                                    {card.rank}{card.suit}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Action Bar */}
                    <div className="bg-neutral-950/80 p-4 border-t border-neutral-800">
                        <div className="text-sm text-center mb-3 text-emerald-400 font-mono tracking-widest uppercase">{gameState.message}</div>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => sendAction("HIT")} disabled={!isActive} className="px-6 py-2 bg-emerald-600 rounded font-bold disabled:opacity-50">Hit</button>
                            <button onClick={() => sendAction("STAND")} disabled={!isActive} className="px-6 py-2 bg-blue-600 rounded font-bold disabled:opacity-50">Stand</button>
                            <button onClick={() => sendAction("DOUBLE")} disabled={!isActive} className="px-6 py-2 bg-amber-600 rounded font-bold text-black disabled:opacity-50">Double</button>
                            {gameState.phase === "roundEnd" && (
                                <button onClick={() => sendAction("READY")} className="px-6 py-2 bg-purple-600 rounded font-bold ml-4">Next Round</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Betting Panel --- */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl h-fit">
                    <label className="text-xs text-neutral-500 uppercase mb-2 block font-bold">Place Bet</label>
                    <div className="text-3xl font-bold font-mono text-amber-400 mb-6 text-center bg-black/30 py-3 rounded-lg border border-neutral-800">
                        {formatCurrency(localBet)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button onClick={() => setLocalBet(Math.max(10, localBet - 10))} disabled={gameState.phase !== "betting"} className="bg-neutral-800 py-2 rounded text-sm disabled:opacity-50">- $10</button>
                        <button onClick={() => setLocalBet(localBet + 10)} disabled={gameState.phase !== "betting"} className="bg-neutral-800 py-2 rounded text-sm disabled:opacity-50">+ $10</button>
                        <button onClick={() => setLocalBet(Math.max(10, localBet - 50))} disabled={gameState.phase !== "betting"} className="bg-neutral-800 py-2 rounded text-sm disabled:opacity-50">- $50</button>
                        <button onClick={() => setLocalBet(localBet + 50)} disabled={gameState.phase !== "betting"} className="bg-neutral-800 py-2 rounded text-sm disabled:opacity-50">+ $50</button>
                    </div>

                    <button
                        onClick={() => sendAction("BET", { amount: localBet })}
                        disabled={gameState.phase !== "betting"}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
                    >
                        SUBMIT BET
                    </button>
                </div>
            </div>
        </div>
    );
}