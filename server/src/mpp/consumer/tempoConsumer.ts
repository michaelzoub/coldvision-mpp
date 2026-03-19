import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TEMPO_BIN =
  process.env["TEMPO_BIN"] ?? `${process.env["HOME"]}/.local/bin/tempo`;

export interface ConsumeOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  dryRun?: boolean;
}

export interface ConsumeResult {
  success: boolean;
  status?: number;
  data?: unknown;
  paymentResponse?: unknown;
  error?: string;
  raw?: string;
}

export async function consumeService(
  serviceId: string,
  path: string,
  options: ConsumeOptions = {},
): Promise<ConsumeResult> {
  const { method = "GET", body, headers = {}, dryRun = false } = options;

  const args: string[] = [
    "request",
    "-t",
    ...(dryRun ? ["--dry-run"] : []),
    "-X",
    method,
  ];

  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }

  if (body !== undefined) {
    args.push("--json", JSON.stringify(body));
  }

  args.push(`/${serviceId}${path}`);

  try {
    const { stdout, stderr } = await execFileAsync(TEMPO_BIN, args, {
      timeout: 60_000,
    });

    if (stderr) {
      console.warn("[MPP consumer] tempo stderr:", stderr);
    }

    let data: unknown;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = stdout;
    }

    return { success: true, data, raw: stdout };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function discoverServices(
  search?: string,
): Promise<ConsumeResult> {
  const args = ["wallet", "-t", "services"];
  if (search) {
    args.push("--search", search);
  }

  try {
    const { stdout } = await execFileAsync(TEMPO_BIN, args, {
      timeout: 30_000,
    });

    let data: unknown;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = stdout;
    }

    return { success: true, data, raw: stdout };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function getWalletStatus(): Promise<ConsumeResult> {
  try {
    const { stdout } = await execFileAsync(
      TEMPO_BIN,
      ["wallet", "-t", "whoami"],
      {
        timeout: 15_000,
      },
    );

    let data: unknown;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = stdout;
    }

    return { success: true, data, raw: stdout };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
