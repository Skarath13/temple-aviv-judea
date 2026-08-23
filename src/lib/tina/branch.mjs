const branchVariables = [
	"WORKERS_CI_BRANCH",
	"GITHUB_BRANCH",
	"VERCEL_GIT_COMMIT_REF",
	"CF_PAGES_BRANCH",
	"HEAD",
];

export const resolveTinaBranch = (environment) => {
	for (const name of branchVariables) {
		const value = environment?.[name];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return "main";
};
