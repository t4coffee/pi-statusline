// Custom status line: context %, context total, cwd, session cost, model, effort, git branch
import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
	let requestRender = () => {};
	// Skills actually loaded in this session: SKILL.md reads plus /skill: commands.
	const skills = new Set<string>();
	const trackSkill = (name: string) => {
		if (skills.has(name)) return;
		skills.add(name);
		requestRender();
	};

	pi.on("tool_execution_start", async (event) => {
		const path = event.toolName === "read" ? String((event.args as { path?: string })?.path ?? "") : "";
		if (!path.endsWith("SKILL.md")) return;
		const parts = path.split("/");
		trackSkill(parts[parts.length - 2] ?? "");
	});

	pi.on("input", async (event) => {
		if (event.source === "extension") return;
		for (const m of String(event.text ?? "").matchAll(/\/skill:([a-z0-9-]+)/g)) trackSkill(m[1]);
	});

	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());
			// re-render when usage/cost changes
			const offEnd = pi.on("agent_end", () => tui.requestRender());
			requestRender = () => tui.requestRender();

			return {
				dispose() {
					unsub();
					offEnd();
				},
				invalidate() {},
				render(width: number): string[] {
					let cost = 0;
					for (const e of ctx.sessionManager.getBranch()) {
						if (e.type === "message" && e.message.role === "assistant") {
							cost += (e.message as AssistantMessage).usage.cost.total;
						}
					}

					const usage = ctx.getContextUsage();
					const pct = usage?.percent != null ? `${Math.round(usage.percent)}%` : "?";
					const tokens = usage?.tokens != null
						? usage.tokens >= 1000 ? `${(usage.tokens / 1000).toFixed(1)}k` : `${usage.tokens}`
						: "?";

					const cwd = ctx.cwd.replace(/^\/Users\/[^/]+/, "~");
					const branch = footerData.getGitBranch();
					const model = ctx.model?.id ?? "no-model";
					const effort = ctx.thinkingLevel ?? "?";

					// Catppuccin style guide, Rainbow Highlights (brackets, headings, etc.): one hue per field,
					// separators keep Color #3 (yellow). Nothing is rendered dim.
					const f = (token: string, t: string) => theme.fg(token, t);
					const sep = f("warning", " · ");

					const left = [
						f("error", pct),
						f("warning", `ctx ${tokens}`),
						f("success", cwd),
						f("mdLink", `$${cost.toFixed(2)}`),
					].join(sep);
					const right = [
						f("accent", model),
						f("text", effort),
						...(branch ? [f("muted", `⎇ ${branch}`)] : []),
					].join(sep);

					const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
					const line = truncateToWidth(left + pad + right, width);

					// Second line: only what is actually in use right now (extension statuses + loaded skills).
					const active = [
						...footerData.getExtensionStatuses().values(),
						...[...skills].map((s) => f("warning", "skill:") + f("accent", s)),
					].map((s) => s.replace(/[\r\n\t]+/g, " ").trim());
					if (active.length === 0) return [line];
					return [line, truncateToWidth(active.join(sep), width, f("muted", "..."))];
				},
			};
		});
	});
}