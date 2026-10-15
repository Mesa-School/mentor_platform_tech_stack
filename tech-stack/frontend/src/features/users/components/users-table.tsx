"use client";

/**
 * The reference client island: URL-driven params → query hook → the four states.
 *
 * Note what it does NOT do: no `fetch`, no service import, no `useEffect` to
 * load data, no `useState` mirroring the response. Search lives in the URL, so
 * the view is shareable and each filter combination caches separately.
 */
import { ArrowDown, ArrowUp, Search, UserPlus, Users2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useTableParams } from "@/hooks/use-table-params";
import { formatRelativeTime } from "@/lib/format";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/types/enums";
import type { User } from "@/types/models";
import { useDeleteUser, useUsers } from "../hooks/use-users";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "lastLoginAt", label: "Last active", sortable: true },
] as const;

export function UsersTable() {
  const { params, setSearch, setSort } = useTableParams();
  // The input is local (it must stay responsive per keystroke); the URL write —
  // which is what triggers the request — is debounced. One query per pause,
  // not one per keystroke, and no side effect during render.
  const [searchInput, setSearchInput] = useState(params.search ?? "");
  const pushSearch = useDebouncedCallback((value: string) => setSearch(value));

  function onSearchChange(value: string) {
    setSearchInput(value);
    pushSearch(value);
  }

  const query = useUsers(params);
  const remove = useDeleteUser();
  const confirm = useDisclosure();
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search users…"
            className="pl-8"
            aria-label="Search users"
          />
        </div>
      </div>

      {query.isPending ? (
        <TableSkeleton columns={COLUMNS.length} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={params.search ? "No matches" : "No users yet"}
          description={
            params.search
              ? `Nothing matched “${params.search}”.`
              : "Invite your first teammate to get started."
          }
          action={
            !params.search && (
              <Button>
                <UserPlus data-icon="inline-start" />
                Invite user
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column.key}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => setSort(column.key)}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        {column.label}
                        {params.sortBy === column.key &&
                          (params.sortDir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          ))}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "default" : "secondary"}
                    >
                      {USER_STATUS_LABELS[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(user.lastLoginAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingUser(user);
                        confirm.open();
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirm.isOpen}
        onOpenChange={confirm.setOpen}
        title="Remove this user?"
        description={
          pendingUser
            ? `${pendingUser.name} will lose access immediately. This cannot be undone.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() =>
          pendingUser ? remove.mutateAsync(pendingUser.id) : undefined
        }
      />
    </div>
  );
}
