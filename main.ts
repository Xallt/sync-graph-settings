import { Plugin, WorkspaceLeaf, TFile} from 'obsidian';
import * as path from "path";
import {readFile} from "fs/promises";

export default class SyncGraphPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "sync-graph-colorgroups-to-localgraph",
			name: "Sync Graph Groups Settings to Local Graph",
			callback: async () => { await this.syncGlobalToLocal() }
		})
	}

	async syncGlobalToLocal() {
		const configDir = app.vault.configDir;
		const graphConfigPath = path.join(configDir, 'graph.json');

		// this.app.vault.getAbstractFileByPath('.obsidian/graph.json') would return null
		// So we're doing it the less safe way
		const graphConfigJson = await this.app.vault.adapter.read(graphConfigPath);
		const graphConfig = JSON.parse(graphConfigJson);
		const graphColorGroups = graphConfig.colorGroups;
		this.getLocalGraphLeaves().forEach((leaf) => {
			this.setColorGroups(leaf, graphColorGroups);
		})
	}

	getLocalGraphLeaves() {
		return this.app.workspace.getLeavesOfType('localgraph');
	}
	
	setColorGroups(localGraphLeaf: WorkspaceLeaf, colorGroups: any) {
		var viewState = localGraphLeaf.getViewState();
		viewState.state.options.colorGroups = colorGroups;
		localGraphLeaf.setViewState(viewState);
	}
}