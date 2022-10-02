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
		const graphConfigFile = this.app.vault.getAbstractFileByPath(graphConfigPath);
		if (graphConfigFile instanceof TFile) {
			const graphConfigJson = await readFile(graphConfigFile.path, {encoding: 'utf-8'});
			const graphConfig = JSON.parse(graphConfigJson);
			this.getLocalGraphLeaves().forEach((leaf) => {
				this.setColorGroups(leaf, graphConfig.colorGroups);
			})
		}
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