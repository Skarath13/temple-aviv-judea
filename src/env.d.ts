type CloudflareRuntime = import("@astrojs/cloudflare").Runtime;

declare namespace App {
	interface Locals extends CloudflareRuntime {}
}
