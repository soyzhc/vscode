/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SpectronApplication } from '../../spectron/application';
import { Element } from 'webdriverio';

export class QuickOpen {

	static QUICK_OPEN_HIDDEN = 'div.quick-open-widget[aria-hidden="true"]';
	static QUICK_OPEN = 'div.quick-open-widget[aria-hidden="false"]';
	static QUICK_OPEN_INPUT = `${QuickOpen.QUICK_OPEN} .quick-open-input input`;
	static QUICK_OPEN_FOCUSED_ELEMENT = `${QuickOpen.QUICK_OPEN} .quick-open-tree .monaco-tree-row.focused .monaco-highlighted-label`;
	static QUICK_OPEN_ENTRY_SELECTOR = 'div[aria-label="Quick Picker"] .monaco-tree-rows.show-twisties .monaco-tree-row .quick-open-entry';

	constructor(readonly spectron: SpectronApplication) {
	}

	async openQuickOpen(): Promise<void> {
		await this.spectron.command('workbench.action.quickOpen');
		await this.waitForQuickOpenOpened();
	}

	async openCommandPallette(): Promise<void> {
		await this.spectron.command('workbench.action.showCommands');
		await this.waitForQuickOpenOpened();
	}

	async closeQuickOpen(): Promise<void> {
		await this.spectron.command('workbench.action.closeQuickOpen');
		await this.waitForQuickOpenClosed();
	}

	async type(text: string): Promise<void> {
		await this.spectron.client.type(text);
	}

	async getQuickOpenElements(): Promise<Element[]> {
		return this.spectron.client.waitForElements(QuickOpen.QUICK_OPEN_ENTRY_SELECTOR);
	}

	async waitForQuickOpenElements(count: number): Promise<Element[]> {
		return this.spectron.client.waitForElements(QuickOpen.QUICK_OPEN_ENTRY_SELECTOR, elements => elements && elements.length === count);
	}

	async openFile(fileName: string): Promise<void> {
		await this.openQuickOpen();
		await this.type(fileName);

		await this.getQuickOpenElements();
		await this.spectron.client.keys(['Enter', 'NULL']);
		await this.spectron.workbench.waitForActiveTab(fileName);
		await this.spectron.workbench.waitForEditorFocus(fileName);
	}

	async runCommand(commandText: string): Promise<void> {
		await this.openCommandPallette();

		// type the text
		await this.type(commandText);

		// wait for best choice to be focused
		await this.spectron.client.waitForTextContent(QuickOpen.QUICK_OPEN_FOCUSED_ELEMENT, commandText);

		// wait and click on best choice
		await this.spectron.client.waitAndClick(QuickOpen.QUICK_OPEN_FOCUSED_ELEMENT);
	}

	async waitForQuickOpenOpened(): Promise<void> {
		await this.spectron.client.waitForActiveElement(QuickOpen.QUICK_OPEN_INPUT);

		// we gotta wait 50 milliseconds due to https://github.com/Microsoft/vscode/blob/master/src/vs/platform/list/browser/listService.ts#L59
		await new Promise(c => setTimeout(c, 50));
	}

	private async waitForQuickOpenClosed(): Promise<void> {
		await this.spectron.client.waitForElement(QuickOpen.QUICK_OPEN_HIDDEN);
	}

	async submit(text: string): Promise<void> {
		await this.spectron.client.type(text);
		await this.spectron.client.keys(['Enter', 'NULL']);
		await this.waitForQuickOpenClosed();
	}

	async selectQuickOpenElement(index: number): Promise<void> {
		await this.waitForQuickOpenOpened();
		for (let from = 0; from < index; from++) {
			await this.spectron.client.keys(['ArrowDown', 'NULL']);
			this.spectron.wait(3);
		}
		await this.spectron.client.keys(['Enter', 'NULL']);
		await this.waitForQuickOpenClosed();
	}
}
