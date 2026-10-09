"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AdminUserOption = {
  hash: string;
  email: string;
};

type ActionState = {
  pending: boolean;
  message: string;
  error: boolean;
};

function useAdminAction() {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    pending: false,
    message: "",
    error: false,
  });

  async function update(url: string, body: unknown) {
    setState({ pending: true, message: "", error: false });
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : response.ok
            ? "Changes saved."
            : "Could not save these changes.";

      setState({ pending: false, message, error: !response.ok });
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setState({
        pending: false,
        message: "Could not reach the server. Please try again.",
        error: true,
      });
    }
  }

  return { state, update };
}

function StatusMessage({ state }: { state: ActionState }) {
  return state.message ? (
    <p
      className={`form-message form-message-${state.error ? "error" : "success"}`}
      role={state.error ? "alert" : "status"}
    >
      {state.message}
    </p>
  ) : null;
}

export function AdminEstablishmentControls({
  id,
  approvalStatus,
  isActive,
  ownerUserId,
  users,
}: {
  id: string;
  approvalStatus: string | null;
  isActive: boolean | null;
  ownerUserId: string | null;
  users: AdminUserOption[];
}) {
  const { state, update } = useAdminAction();
  const [owner, setOwner] = useState(ownerUserId ?? "");
  const [status, setStatus] = useState(approvalStatus ?? "pending");
  const [active, setActive] = useState(isActive === true);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await update(`/api/admin/establishments/${encodeURIComponent(id)}`, {
      approvalStatus: status,
      isActive: active,
      ownerUserId: owner || null,
    });
  }

  return (
    <form className="dashboard-controls" onSubmit={save}>
      <label>
        <span>Approval</span>
        <select
          value={status}
          disabled={state.pending}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label>
        <span>Account</span>
        <select
          value={owner}
          disabled={state.pending}
          onChange={(event) => setOwner(event.target.value)}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.hash} value={user.hash}>
              {user.email}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Owner account code</span>
        <input
          type="text"
          value={owner}
          maxLength={64}
          pattern="[a-f0-9]{64}"
          placeholder="Paste a business account code"
          disabled={state.pending}
          onChange={(event) => setOwner(event.target.value)}
        />
      </label>
      <label className="dashboard-checkbox">
        <input
          type="checkbox"
          checked={active}
          disabled={state.pending}
          onChange={(event) => setActive(event.target.checked)}
        />
        Active
      </label>
      <button className="quiet-button" type="submit" disabled={state.pending}>
        {state.pending ? "Saving..." : "Save"}
      </button>
      <StatusMessage state={state} />
    </form>
  );
}

export function AdminOfferControls({
  id,
  publicationStatus,
}: {
  id: string;
  publicationStatus: string | null;
}) {
  const { state, update } = useAdminAction();
  const [status, setStatus] = useState(publicationStatus ?? "draft");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await update(`/api/admin/offers/${encodeURIComponent(id)}`, {
      publicationStatus: status,
    });
  }

  return (
    <form className="dashboard-inline-controls" onSubmit={save}>
      <select
        aria-label="Offer publication status"
        value={status}
        disabled={state.pending}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
      <button className="quiet-button" type="submit" disabled={state.pending}>
        {state.pending ? "Saving..." : "Update"}
      </button>
      <StatusMessage state={state} />
    </form>
  );
}

export function AdminUserAccessControl({
  userHash,
  email,
  blocked,
}: {
  userHash: string;
  email: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    pending: false,
    message: "",
    error: false,
  });

  async function toggle() {
    setState({ pending: true, message: "", error: false });
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userHash, email, blocked: !blocked }),
      });
      const payload: unknown = await response.json();
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : response.ok
            ? "Account access updated."
            : "Could not update account access.";

      setState({ pending: false, message, error: !response.ok });
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setState({
        pending: false,
        message: "Could not reach the server. Please try again.",
        error: true,
      });
    }
  }

  return (
    <div className="dashboard-user-control">
      <button
        className="quiet-button"
        type="button"
        disabled={state.pending}
        onClick={toggle}
      >
        {state.pending
          ? "Saving..."
          : blocked
            ? "Restore access"
            : "Block account"}
      </button>
      <StatusMessage state={state} />
    </div>
  );
}
