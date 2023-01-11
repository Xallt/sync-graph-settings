import { Plugin, WorkspaceLeaf, normalizePath} from 'obsidian';

export default class SyncGraphPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "sync-graph-colorgroups-to-localgraph",
			name: "Sync Graph Groups Settings to Local Graph",
			callback: async () => { await this.syncGlobalToLocal() }
		})
	}

	async syncGlobalToLocal() {
		const configDir = this.app.vault.configDir;
		const graphConfigPath = normalizePath(configDir + '/graph.json');

		// this.app.vault.getAbstractFileByPath('.obsidian/graph.json') would return null
		// So we're doing it the less safe way
		// const graphConfigJson = await this.app.vault.adapter.read(graphConfigPath);
		// const graphConfigFile = app.vault.getAbstractFileByPath(graphConfigPath);
		// if (graphConfigFile instanceof TFile) {
		if (true) {
			// const graphConfigJson = await app.vault.read(graphConfigFile);
			const graphConfigJson = await this.app.vault.adapter.read(graphConfigPath);
			const graphConfig = JSON.parse(graphConfigJson);
			const graphColorGroups = graphConfig.colorGroups;
			this.getLocalGraphLeaves().forEach((leaf) => {
				this.setColorGroups(leaf, graphColorGroups);
			})
		} else {
			// console.log(graphConfigPath);
			// console.log(graphConfigFile);
		}
	}

	getLocalGraphLeaves() {
		return this.app.workspace.getLeavesOfType('localgraph');
	}
	
	setColorGroups(localGraphLeaf: WorkspaceLeaf, colorGroups: any) {
		const viewState = localGraphLeaf.getViewState();
		viewState.state.options.colorGroups = colorGroups;
		localGraphLeaf.setViewState(viewState);
	}
}