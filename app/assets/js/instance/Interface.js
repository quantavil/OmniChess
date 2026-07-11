import { updatePipData } from '../gui/pip.js';

function getArrowStyle(type, fill, opacity) {
    const getBaseStyleModification = (f, o) => [
        'stroke: rgb(0 0 0 / 50%);',
        'stroke-width: 2px;',
        'stroke-linejoin: round;',
        `fill: ${fill || f};`,
        `opacity: ${opacity || o};`
    ].join('\n');

    switch(type) {
        case 'best': 
            return getBaseStyleModification('limegreen', 0.9);
        case 'secondary': 
            return getBaseStyleModification('dodgerblue', 0.7);
        case 'opponent':
            return getBaseStyleModification('crimson', 0.3);
    }
}

export default class Interface {
    constructor(instance) {
        this.OmniChessInstance = instance;
    }

    async markMoves(moveObjArr, profile) {
        this.removeMarkings(profile, 'Make room for new move markings');

        const maxScale = 1, minScale = 0.5, totalRanks = moveObjArr.length;
        const BoardDrawer = this.OmniChessInstance.BoardDrawer;
        const cfgKeys = this.OmniChessInstance.configKeys;
        
        const [
            arrowOpacity,
            showOpponentMoveGuess,
            showOpponentMoveGuessConstantly,
            primaryArrowColorHex,
            secondaryArrowColorHex,
            opponentArrowColorHex,
            moveAsFilledSquares,
            onlySuggestPieces,
            movesOnDemand
        ] = await Promise.all([
            this.OmniChessInstance.getConfigValue(cfgKeys.arrowOpacity, profile).then(v => v/100),
            this.OmniChessInstance.getConfigValue(cfgKeys.showOpponentMoveGuess, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.showOpponentMoveGuessConstantly, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.primaryArrowColorHex, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.secondaryArrowColorHex, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.opponentArrowColorHex, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.moveAsFilledSquares, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.onlySuggestPieces, profile),
            this.OmniChessInstance.getConfigValue(cfgKeys.movesOnDemand, profile)
        ]);
    
        const markedSquares = [[], []]; // [primary, secondary]
    
        const fillSquare = (square, style) => BoardDrawer.createShape('rectangle', square, {style});
    
        const handleOpponentDisplay = (square, elem) => {
            const listener = BoardDrawer.addSquareListener(square, type => {
                if(!elem) listener.remove();
                elem.style.display = type === 'enter' ? 'inherit' : 'none';
            });
        };
    
        moveObjArr.forEach((mObj, idx) => {
            const [from, to] = mObj.player, [oppFrom, oppTo] = mObj.opponent;
            const oppMovesExist = oppFrom && oppTo, rank = idx + 1, cp = mObj.cp;
    
            if(onlySuggestPieces && !movesOnDemand) {
                const fillType = idx === 0 ? 1 : 0, fillColor = fillType ? primaryArrowColorHex : secondaryArrowColorHex;
                const fromSquare = fillSquare(from, `opacity: ${arrowOpacity}; stroke-width:5; stroke:black; rx:2; ry:2; fill:${fillColor};`);
                const elems = [fromSquare];
    
                if(oppFrom) {
                    const oppElem = fillSquare(oppFrom, `opacity:${arrowOpacity}; stroke-width:5; stroke:black; rx:2; ry:2; display:none; fill:${opponentArrowColorHex};`);
                    handleOpponentDisplay(from, oppElem);
                    elems.push(oppElem);
                }
    
                this.OmniChessInstance.pV[profile].activeGuiMoveMarkings.push({otherElems: elems});
            }
            else if(moveAsFilledSquares) {
                const fillType = idx === 0 ? 1 : 0, fillColor = fillType ? primaryArrowColorHex : secondaryArrowColorHex;
                const styleBase = `opacity:${arrowOpacity}; stroke-width:5; stroke:black; rx:2; ry:2; fill:${fillColor};`;
                const fromStyle = styleBase + (markedSquares[fillType].includes(from) ? 'opacity:0;' : '');
                const toStyle = `filter:brightness(1.5); stroke-dasharray:4 4; ${styleBase}` + (markedSquares[fillType].includes(to) ? 'opacity:0;' : '');
                const elems = [fillSquare(from, fromStyle), fillSquare(to, toStyle)];
    
                if(oppMovesExist && showOpponentMoveGuess) {
                    const oppFromElem = fillSquare(oppFrom, fromStyle + ` fill:${opponentArrowColorHex};`);
                    const oppToElem = fillSquare(oppTo, toStyle + ` fill:${opponentArrowColorHex};`);
                    elems.push(oppFromElem, oppToElem);
    
                    if(showOpponentMoveGuessConstantly) {
                        oppFromElem.style.display = oppToElem.style.display = 'block';
                    } else {
                        oppFromElem.style.display = oppToElem.style.display = 'none';
                        handleOpponentDisplay(from, oppFromElem);
                        handleOpponentDisplay(from, oppToElem);
                    }
                }
    
                markedSquares[fillType].push(from, to);
                this.OmniChessInstance.pV[profile].activeGuiMoveMarkings.push({otherElems: elems});
            }
            else {
                let arrowStyle = getArrowStyle('best', primaryArrowColorHex, arrowOpacity);
                let [lineWidth, arrowheadWidth, arrowheadHeight, startOffset] = [30, 80, 60, 30];
    
                if(idx !== 0) {
                    arrowStyle = getArrowStyle('secondary', secondaryArrowColorHex, arrowOpacity);
                    const scale = totalRanks === 2 ? 0.75 : maxScale - (maxScale - minScale) * ((rank-1)/(totalRanks-1));
                    lineWidth *= scale; arrowheadWidth *= scale; arrowheadHeight *= scale;
                }
    
                const playerArrowElem = BoardDrawer.createShape('arrow', [from, to], {style: arrowStyle, lineWidth, arrowheadWidth, arrowheadHeight, startOffset});
                let oppArrowElem = null;
    
                if(oppMovesExist && showOpponentMoveGuess) {
                    oppArrowElem = BoardDrawer.createShape('arrow', [oppFrom, oppTo], {style: getArrowStyle('opponent', opponentArrowColorHex, arrowOpacity), lineWidth, arrowheadWidth, arrowheadHeight, startOffset});
                    if(showOpponentMoveGuessConstantly) oppArrowElem.style.display = 'block';
                    else {
                        oppArrowElem.style.display = 'none';
                        handleOpponentDisplay(from, oppArrowElem);
                    }
                }
    
                if(idx === 0 && playerArrowElem) {
                    const p = playerArrowElem.parentElement;
                    p.appendChild(playerArrowElem);
                    if(oppArrowElem) p.appendChild(oppArrowElem);
                }
    
                this.OmniChessInstance.pV[profile].activeGuiMoveMarkings.push({...mObj, playerArrowElem, oppArrowElem});
            }
        });
    
        this.OmniChessInstance.pV[profile].pastMoveObjects = [];
    }
    
    removeMarkingFromProfile(p) {
        this.OmniChessInstance.pV[p].activeGuiMoveMarkings.forEach(markingObj => {
            markingObj.oppArrowElem?.remove();
            markingObj.playerArrowElem?.remove();
            markingObj?.otherElems?.forEach(x => x?.remove());
        });

        this.OmniChessInstance.pV[p].activeGuiMoveMarkings = [];
    }

    removeMarkings(profile, reason) {
        if(this.OmniChessInstance.debugLogsEnabled) console.warn('[Remove markings] FOR:', reason);
    
        if(!profile) {
            Object.keys(this.OmniChessInstance.pV).forEach(profileName => {
                this.removeMarkingFromProfile(profileName);
            });
        } else {
            this.removeMarkingFromProfile(profile);
        }
    }
    
    async updateBoardFen(fen) {
        // Most up to date userscript versions handle this itself, so commenting out for now.
        //if(this.OmniChessInstance.currentFen === fen) return;
    
        const moveObj = EXTRACT_MOVE_FROM_FEN(this.OmniChessInstance.currentFen, fen);
        const movedPieceLowered = moveObj?.movedPiece?.toLowerCase();
        const instanceFenElem = this?.OmniChessInstance?.instanceElem?.querySelector('.instance-fen');

        if(!instanceFenElem) return;

        if(this.OmniChessInstance.debugLogsEnabled) {
            const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
            const fens = [this.OmniChessInstance.currentFen, fen];
            const fensString = fens.map(x => x.split(' ')[0]).join(',');
    
            console.warn('%c[ NEW FEN RECEIVED! ]', 'color: neon; font-weight: bold; font-size: 50px;');
            console.warn('[Logical Change Detection] New board FEN received:', `${origin}/OmniChess/board/?fens=${fensString}&o=${this.OmniChessInstance.lastOrientation}`, { fen, moveObj });
        }
    
        if(movedPieceLowered === 'k') {
            const kingColor = moveObj?.movedPiece === movedPieceLowered
                ? 'b' : 'w';
    
            if(!this.OmniChessInstance.kingMoved.includes(kingColor))
                this.OmniChessInstance.kingMoved += kingColor;
        }

        if(!moveObj?.color) {
            const playerColor = await this.OmniChessInstance.getPlayerColor();
            moveObj.color = playerColor.toLowerCase() === 'w' ? 'b' : 'w';
        }
    
        fen = MODIFY_FEN_CASTLE_RIGHTS(fen, this.OmniChessInstance.kingMoved);
    
        this.OmniChessInstance.currentFen = fen;
    
        USERSCRIPT.instanceVars.fen.set(this.OmniChessInstance.instanceID, fen);
    
        if(instanceFenElem) instanceFenElem.innerText = fen;
        if(this.OmniChessInstance.chessground) this.OmniChessInstance.chessground.set({ fen });

        this.OmniChessInstance.engineStopCalculating(false, 'New board FEN, any running calculations are now useless!');

        this.removeMarkings(null, 'New board FEN');
    
        // For each profile config
        Object.keys(this.OmniChessInstance.pV).forEach(profileName => {
            this.OmniChessInstance.pV[profileName].currentSpeeches.forEach(synthesis => synthesis.cancel());
            this.OmniChessInstance.pV[profileName].currentSpeeches = [];
    
            this.OmniChessInstance.renderMetric(fen, profileName);
        });
    
        updatePipData({ 'moveObjects': null });
    
        this.OmniChessInstance.renderFeedback(fen);
        this.OmniChessInstance.calculateBestMoves(fen, { moveObj });
    
        this.OmniChessInstance.moveHistory.push({
            'fen': fen,
            'move': moveObj
        });
    }
    
    updateBoardOrientation(orientation) {
        if(orientation === this.OmniChessInstance.lastOrientation) return;
        
        this.OmniChessInstance.lastOrientation = orientation;
    
        Object.keys(this.OmniChessInstance.pV).forEach(profileName => {
            this.OmniChessInstance.pV[profileName].lastCalculatedFen = null;
        });
    
        const orientationWord = orientation === 'b' ? 'black' : 'white';
    
        const evalBarElem = this.OmniChessInstance.instanceElem.querySelector('.eval-bar');
    
        if(orientation === 'b')
            evalBarElem.classList.add('reversed');
        else
            evalBarElem.classList.remove('reversed');
    
        this.OmniChessInstance.chessground.toggleOrientation();
        this.OmniChessInstance.chessground.redrawAll();
        this.OmniChessInstance.chessground.set({ 'orientation': orientationWord });
    
        this.OmniChessInstance.BoardDrawer.setOrientation(orientation);
    }
    
    updateMoveProgress(text, status) {
        if(!this.OmniChessInstance.instanceElem) return;
    
        const infoTextElem = this.OmniChessInstance.instanceElem.querySelector('.instance-info-text');
    
        infoTextElem.innerText = text;
    
        updatePipData({ 'moveProgressText': text });
        updatePipData({ 'isWinning': status });
    
        const statusArr = ['info-text-winning', 'info-text-losing'];
    
        if(typeof status === 'number' && status !== 0) {
            infoTextElem.classList.add(statusArr[status === 1 ? 0 : 1]);
            infoTextElem.classList.remove(statusArr[status === 1 ? 1 : 0]);
        } else {
            infoTextElem.classList.remove(statusArr[0]);
            infoTextElem.classList.remove(statusArr[1]);
        }
    
        infoTextElem.classList.remove('hidden');
    }
    
    async updateEval(centipawnEval, mate, profile) {
        if(!this.OmniChessInstance.instanceElem) return;
    
        const evalFill = this.OmniChessInstance.instanceElem.querySelector('.eval-fill');
        const gradualness = 8;
        const playerColor = await this.OmniChessInstance.getPlayerColor(profile);
    
        if(this.OmniChessInstance.lastTurn !== playerColor) return;

        if(playerColor === 'b') {
            centipawnEval = -centipawnEval;
        }
    
        let advantage = 1 / (1 + 10**(-centipawnEval / 100 / gradualness)); // [-1, 1]
    
        if(mate)
            advantage = centipawnEval > 0 ? 1 : 0;
    
        updatePipData({ 'eval': advantage, playerColor, centipawnEval });
    
        evalFill.style.height = `${advantage * 100}%`;
    }
    
    displayConnectionIssueWarning() {
        const connectionWarningElem = this.OmniChessInstance.instanceElem?.querySelector('.connection-warning');
    
        if(connectionWarningElem) {
            connectionWarningElem.classList.remove('hidden');
        }
    }
    
    removeConnectionIssueWarning() {
        const connectionWarningElem = this.OmniChessInstance.instanceElem?.querySelector('.connection-warning');
    
        if(connectionWarningElem) {
            connectionWarningElem.classList.add('hidden');
        }
    }
    
    frontLog(str) {
        const message = `[FRONTEND] ${str}`;
    
        console.log('%c' + message, 'color: dodgerblue');
    }
}