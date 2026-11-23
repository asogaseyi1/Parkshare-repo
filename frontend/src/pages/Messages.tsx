// src/pages/Messages.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { IconAlert, IconMessage, IconSend, IconUser } from '../components/Icons';
import { getEmail } from '../lib/session';
import { formatDateTime } from '../lib/format';
import { Conversation, Message } from '../types/Message';
import './Messages.css';

const CONVERSATIONS_POLL_MS = 10_000;
const THREAD_POLL_MS = 4_000;

/** Which side of the conversation the signed-in user is on. */
const counterpartOf = (conversation: Conversation, myEmail: string) =>
  conversation.hostEmail.toLowerCase() === myEmail.toLowerCase()
    ? conversation.guestEmail
    : conversation.hostEmail;

const Messages: React.FC = () => {
  const myEmail = (getEmail() || '').toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conversationId'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const latestSentAtRef = useRef<string | null>(null);

  // Conversation list — refreshed on an interval so a new thread or a reply
  // elsewhere becomes visible without a manual reload.
  useEffect(() => {
    let active = true;

    const load = () => {
      api
        .get('/conversations')
        .then((res) => {
          if (!active) return;
          setConversations(Array.isArray(res.data) ? res.data : []);
          setListError('');
        })
        .catch(() => active && setListError('Couldn’t load your conversations.'))
        .finally(() => active && setListLoading(false));
    };

    load();
    const interval = setInterval(load, CONVERSATIONS_POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Keep the URL's conversationId in sync so a refresh or a shared link reopens the same thread.
  useEffect(() => {
    if (selectedId) {
      setSearchParams({ conversationId: selectedId }, { replace: true });
    }
  }, [selectedId, setSearchParams]);

  // Selected thread — initial bounded load, then polling deltas via `since`.
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let active = true;
    latestSentAtRef.current = null;
    setMessages([]);
    setThreadLoading(true);
    setThreadError('');

    api
      .get(`/conversations/${selectedId}/messages`)
      .then((res) => {
        if (!active) return;
        const initial: Message[] = Array.isArray(res.data) ? res.data : [];
        setMessages(initial);
        if (initial.length > 0) latestSentAtRef.current = initial[initial.length - 1].sentAt;
      })
      .catch(() => active && setThreadError('Couldn’t load this conversation.'))
      .finally(() => active && setThreadLoading(false));

    const interval = setInterval(() => {
      api
        .get(`/conversations/${selectedId}/messages`, {
          params: latestSentAtRef.current ? { since: latestSentAtRef.current } : undefined,
        })
        .then((res) => {
          if (!active) return;
          const fresh: Message[] = Array.isArray(res.data) ? res.data : [];
          if (fresh.length === 0) return;
          setMessages((prev) => [...prev, ...fresh]);
          latestSentAtRef.current = fresh[fresh.length - 1].sentAt;
        })
        .catch(() => {
          /* transient polling failure — next tick retries */
        });
    }, THREAD_POLL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId) return;

    setSending(true);
    setThreadError('');

    try {
      const res = await api.post(`/conversations/${selectedId}/messages`, { body });
      setMessages((prev) => [...prev, res.data]);
      latestSentAtRef.current = res.data.sentAt;
      setDraft('');
    } catch {
      setThreadError('That message didn’t send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page messages">
      <Navbar backToDashboard />

      <div className="container container-wide">
        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">
              <IconMessage />
              Messages
            </span>
            <h1 className="page-head__title">Conversations</h1>
            <p className="page-head__sub">Talk directly with hosts and guests about a listing.</p>
          </div>
        </header>

        {listError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <IconAlert />
            <span>{listError}</span>
          </div>
        )}

        <div className="messages__layout">
          {/* ------------------------------------------------------ sidebar */}
          <aside className="messages__panel card">
            <div className="messages__scroll">
              {listLoading ? (
                [0, 1, 2].map((index) => (
                  <div key={index} className="convo-card convo-card--skeleton">
                    <span className="skeleton" style={{ height: '1rem', width: '60%' }} />
                    <span className="skeleton" style={{ height: '0.75rem', width: '85%' }} />
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">
                    <IconMessage />
                  </span>
                  <p className="empty-state__title">No conversations yet</p>
                  <p className="empty-state__text">
                    Message a host from a listing, or a guest will reach out about yours.
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isSelected = conversation.id === selectedId;
                  return (
                    <article
                      key={conversation.id}
                      className={`convo-card ${isSelected ? 'convo-card--selected' : ''}`}
                      onClick={() => setSelectedId(conversation.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(conversation.id);
                        }
                      }}
                    >
                      <div className="convo-card__top">
                        <span className="convo-card__icon">
                          <IconUser />
                        </span>
                        <div className="convo-card__heading">
                          <h3 className="convo-card__name">{counterpartOf(conversation, myEmail)}</h3>
                          <span className="convo-card__listing">{conversation.parkingSpaceTitle}</span>
                        </div>
                      </div>
                      <span className="convo-card__time">{formatDateTime(conversation.lastMessageAt)}</span>
                    </article>
                  );
                })
              )}
            </div>
          </aside>

          {/* ----------------------------------------------------- thread */}
          <div className="messages__thread card">
            {!selected ? (
              <div className="empty-state messages__thread-empty">
                <span className="empty-state__icon">
                  <IconMessage />
                </span>
                <p className="empty-state__title">Pick a conversation</p>
                <p className="empty-state__text">Select a thread from the left to read and reply.</p>
              </div>
            ) : (
              <>
                <div className="messages__thread-head">
                  <span className="convo-card__icon">
                    <IconUser />
                  </span>
                  <div>
                    <h2 className="messages__thread-title">{counterpartOf(selected, myEmail)}</h2>
                    <span className="messages__thread-sub">{selected.parkingSpaceTitle}</span>
                  </div>
                </div>

                <div className="messages__scroll messages__bubbles">
                  {threadLoading ? (
                    <span className="spinner spinner-lg" style={{ margin: 'auto' }} />
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted" style={{ margin: 'auto' }}>
                      Say hello — this is the start of your conversation.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.senderEmail.toLowerCase() === myEmail;
                      return (
                        <div
                          key={message.id}
                          className={`bubble ${isMine ? 'bubble--mine' : 'bubble--theirs'}`}
                        >
                          <p className="bubble__body">{message.body}</p>
                          <span className="bubble__time">{formatDateTime(message.sentAt)}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {threadError && (
                  <div className="alert alert-danger" role="alert" style={{ margin: '0 1rem' }}>
                    <IconAlert />
                    <span>{threadError}</span>
                  </div>
                )}

                <form className="messages__compose" onSubmit={handleSend}>
                  <textarea
                    className="textarea"
                    placeholder="Write a message…"
                    value={draft}
                    rows={1}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={sending || !draft.trim()}>
                    <IconSend />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
