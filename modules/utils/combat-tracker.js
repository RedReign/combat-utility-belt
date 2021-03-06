import { Sidekick } from "../sidekick.js";
import * as BUTLER from "../butler.js";
import { TemporaryCombatants } from "../temporary-combatants/temporary-combatants.js";
import { PanSelect } from "../pan-select.js";

export class TrackerUtility {

    /**
     * Hook on the combat update,
     * Pans or selects the current token
     */
    static _hookOnUpdateCombat(combat, update, options, userId) {
        //let tracker = combat.entities ? combat.entities.find(tr => tr._id === update._id) : combat;

        if (!game.combat || game.combat.turns.length === 0) {
            return;
        }

        const enablePan = Sidekick.getSetting(BUTLER.SETTING_KEYS.panSelect.enablePan);
        const enableSelect = Sidekick.getSetting(BUTLER.SETTING_KEYS.panSelect.enableSelect);

        if (enablePan) {
            PanSelect._panHandler(combat, update);
        }

        if (enableSelect) {
            PanSelect._selectHandler(combat, update);
        }
    }

    /**
     * Handler for deleteCombat hook
     * @param {*} combat 
     * @param {*} options 
     * @param {*} userId 
     */
    static _onDeleteCombat(combat, options, userId) {
        if (!game.userId === userId) {
            return;
        }

        const enableTempCombatants = Sidekick.getSetting(BUTLER.SETTING_KEYS.tempCombatants.enable);
        const tempCombatants = combat.combatants.filter(c => hasProperty(c, `flags.${BUTLER.FLAGS.temporaryCombatants.temporaryCombatant}`));

        if (enableTempCombatants && tempCombatants.length) {
            TemporaryCombatants._removeTemporaryCombatants(tempCombatants, combat.scene);
        }  
    }

    /**
     * Handler for deleteCombatant hook
     * @param {*} combat 
     * @param {*} combatId 
     * @param {*} combatantId 
     * @param {*} options 
     */
    static _onDeleteCombatant(combat, combatant, options, userId) {
        const tokenData = combatant.token.data || null;

        if (hasProperty(tokenData, `flags.${BUTLER.FLAGS.temporaryCombatants.temporaryCombatant}`)) {
            TemporaryCombatants._removeTemporaryCombatant(combatant, combat.scene);
        }
    }

    /**
     * Handler for combat tracker render
     * @param {*} app 
     * @param {*} html 
     * @param {*} data 
     */
    static async _onRenderCombatTracker(app, html, data) {
        if (!game.user.isGM) {
            return;
        }

        const resourceSpans = html.find(".resource");

        if (resourceSpans.length) {
            TrackerUtility._replaceResourceElement(html);
        }
    } 

    /**
     * Replaces the default token resource span with a text input
     * @param {*} html 
     */
    static _replaceResourceElement(html) {
        // Find all the resource spans
        const resourceSpans = html.find(".resource");


        // Replace the element
        $(resourceSpans).each(function() {
            $(this).replaceWith('<input type="text" name="resource" value="' + $(this).text() + '">');
        });

        const resourceInputs = html.find('input[name="resource"]');
        resourceInputs.on("change", event => TrackerUtility._onChangeResource(event));
    }

    /**
     * Handler for updates to the token resource
     * @param {*} event 
     */
    static async _onChangeResource(event) {
        // Get the tracker settings and extract the resource property
        const trackerSettings = game.settings.get("core", Combat.CONFIG_SETTING);
        const resource = trackerSettings.resource;

        // Find the parent list element
        const li = event.target.closest("li");

        // Get the tokenId from the list element
        const tokenId = li.dataset.tokenId;

        // Find the token and update
        const token = canvas.tokens.get(tokenId);
        await token.actor.update({["data." + resource]: event.target.value});
    }
}