const Binance = require('node-binance-api');
const binance = new Binance();

const triggerPercent = 0.01;             //How much should the bestask price change for it to trigger.
const triggerSymbol = 'BTCUSDT';        //What are we watching for a trigger.
const triggerTime = 1000;               //How many milliseconds should we log for after a trigger.

const symbols = ['ICPUSDT','BTCUSDT'];  //What should we watch after the trigger.



// Mess below.



let previousSymbolData = {}; //Data of previous update.
let triggerSymbolData = {}; //Data at time of trigger.
symbols.forEach(symbol => {
    triggerSymbolData[symbol] = null;
    previousSymbolData[symbol] = null;
})

let previousTriggerData = null;
let triggeredTimestamp = null;
binance.futuresBookTickerStream(function(data){
    if(triggeredTimestamp !== null && ((Date.now()-triggeredTimestamp) > triggerTime)){
        triggeredTimestamp = null;
        symbols.forEach(symbol => {
            triggerSymbolData[symbol] = null;
        })
    }
    if(triggerSymbol === data.symbol){
        if(triggeredTimestamp === null){
            if(previousTriggerData !== null){
                let change = 100-((data.bestAsk/previousTriggerData.bestAsk)*100);
                if(change > triggerPercent){
                    triggeredTimestamp = Date.now();
                    triggerSymbolData = Object.assign({}, previousSymbolData); //Stupid references.
                    console.log("Triggered, a "+change+"% in "+triggerSymbol+" at "+(new Date().getTime()))
                }
            }
        }
        previousTriggerData = data;
    }
    if(symbols.includes(data.symbol) && triggeredTimestamp){
        if(triggeredTimestamp !== null && triggerSymbolData[data.symbol] === null){
            triggerSymbolData[data.symbol] = data;
        }
        if(previousSymbolData[data.symbol] === null){
            previousSymbolData[data.symbol] = data;
        }else{
            //Time since trigger.
            let time = Date.now()-triggeredTimestamp;
            //Change since last update.
            let change = 100-((data.bestAsk/previousSymbolData[data.symbol].bestAsk)*100);
            //Change since trigger.
            let overall_change = 100-((data.bestAsk/triggerSymbolData[data.symbol].bestAsk)*100);
            console.log("["+time+"] "+data.symbol+" "+change+"% | "+overall_change+"% ("+data.bestAsk+")");
            previousSymbolData[data.symbol] = data;
        }

    }
});
