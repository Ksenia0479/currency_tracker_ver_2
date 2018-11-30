function loadRUBData() {
    // Create new object XMLHttpRequest
    let xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } 
    else {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    const dateInterval = 430000;
    let currentDate = Math.floor(Date.now() / 1000);
    let startDate = currentDate - dateInterval;
    
    /*Object.defineProperty(document, "referrer", {get : function(){ return "my new referrer"; }});*/
    let urlRUB = `https://charts.forexpf.ru/html/tw/history?symbol=29&resolution=5&from=${startDate}&to=${currentDate}`;

    //Make the configuration: GET-request on URL posted below
    xhr.onreadystatechange = function() {
        if (xhr.status === 200 && xhr.readyState === 4) {
            let value = JSON.parse(xhr.responseText);
            let parsedInfo = value;
            getCurrencyTracker(parsedInfo);
        }
    }
    xhr.open("GET", urlRUB);
    xhr.send();
}
function loadBYNData(parsedRUBInfo) {
    let xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    let currentDate = Date.now();
    let urlBYN = `https://bcse.by/ru/instruments/tradegraph?instrumentId=1077&field=Rate&daysBackward=7&payTerm=&_=${currentDate}`;
    
    //Make the configuration: GET-request on URL posted below
    xhr.onreadystatechange = function() {
        if (xhr.status === 200 && xhr.readyState === 4) {
            let value = JSON.parse(xhr.responseText);
            let parsedBYNRate = value;
            getCurrencyTracker(parsedRUBInfo, parsedBYNRate);
        }
    }
    xhr.open("GET", urlBYN);
    xhr.send();
}
function getCurrencyTracker(parsedRUBInfo) {
    const lineWidthAlign = 0.5;
    let stepY;
    let x = 0;
    let y = 0;
    let delta = 0;
    let scale = 1;
    let rectangleWidth = 30; 
    let rectangleSpace = 20;
    let startRatePoint = 0;
    let deltaIntervalLeft = 0;
    let deltaIntervalRight = 0;
    let shiftX = 0;
    let canvasChartGrid = document.getElementById('chart_grid'); 
    function drawRUBCurrencyPage() {
        let canvasChartContainer = document.getElementById('chart-markup-table-pane');
        let ctx = canvasChartGrid.getContext('2d');
        canvasChartGrid.style.cursor = 'crosshair';
        canvasChartGrid.width = canvasChartContainer.clientWidth;
        canvasChartGrid.height = 750;
        drawRateChart(ctx, canvasChartGrid);
        
        canvasChartGrid.addEventListener('mousemove', drawMouseTrackerLines);
        function drawMouseTrackerLines(event) {
            let lineX = event.clientX - canvasChartGrid.getBoundingClientRect().left - canvasChartGrid.clientLeft; 
            let lineY = event.clientY - canvasChartGrid.getBoundingClientRect().top - canvasChartGrid.clientTop;
            ctx.clearRect(x, y, canvasChartGrid.width, canvasChartGrid.height);
            drawRateChart(ctx, canvasChartGrid);
            drawMouseDashedLines(ctx, lineX, lineY);
        }
        canvasChartGrid.addEventListener('mousedown', getStartDeltaX);
        function getStartDeltaX(event) {
            canvasChartGrid.style.cursor = 'grabbing';
            let startDeltaX = event.clientX - canvasChartGrid.getBoundingClientRect().left + pageXOffset - delta - canvasChartGrid.clientLeft;
            canvasChartGrid.addEventListener('mousemove', getEndDeltaX);
            function getEndDeltaX(event) { 
                let endDeltaX = event.clientX - canvasChartGrid.getBoundingClientRect().left + pageXOffset;
                delta = endDeltaX - startDeltaX;
            }     
            canvasChartGrid.addEventListener('mouseup', fixChartPosition);
            function fixChartPosition() {
                canvasChartGrid.style.cursor = 'crosshair';
                canvasChartGrid.removeEventListener('mousemove', getEndDeltaX);
            }                        
        }
        canvasChartGrid.addEventListener('wheel', getScaleY); 
        function getScaleY(event){
            const scaleStep = 0.0125;
            const maxScalePoint = 0.2;
            let dX = event.wheelDelta;
            if (dX < 0 && scale > maxScalePoint){
                scale -= scaleStep; 
            }
            else if (scale < 1 && dX > 0){
                scale += scaleStep;
            }  
            rectangleWidth = Math.round(30 * scale); 
            rectangleSpace = Math.round(20 * scale);                    

            drawRateChart(ctx, canvasChartGrid);
        }
    }
    function drawMouseDashedLines(ctx, mouseCoordinateX, mouseCoordinateY) {
        let lineX;
        let rectangleInterval = rectangleSpace + rectangleWidth;
        let lineSpace = Number(rectangleSpace / 2 / rectangleInterval).toFixed(2);
        let positionX = Number((canvasChartGrid.width - mouseCoordinateX + deltaIntervalLeft) / Number(rectangleInterval * scale).toFixed(2)).toFixed(2); 

        if ((positionX % 1) >= lineSpace) {
            lineX = canvasChartGrid.width - Math.round(((rectangleWidth + rectangleSpace) * Math.ceil(positionX) - rectangleWidth / 2) * scale) + deltaIntervalLeft;
        }
        else {
            lineX = canvasChartGrid.width - Math.round(((rectangleWidth + rectangleSpace) * Math.floor(positionX) - rectangleWidth / 2) * scale) + deltaIntervalLeft;
        }

        ctx.strokeStyle = '#A9A9A9';
        ctx.setLineDash([4, 2]);
        ctx.beginPath();

        // vertical line drawing
        ctx.moveTo(Math.round(lineX) + lineWidthAlign, y);
        ctx.lineTo(Math.round(lineX) + lineWidthAlign, canvasChartGrid.height);
        
        // horizontal line drawing
        ctx.moveTo(x, lineWidthAlign + mouseCoordinateY);
        ctx.lineTo(canvasChartGrid.width, lineWidthAlign + mouseCoordinateY);
        ctx.stroke();
    }
    function drawGrid(ctx, lineCapacity) {
        const timeTradingInterval = 5;
        const totalTime = 60;
        let rectangleInterval = rectangleWidth + rectangleSpace;
        
        ctx.strokeStyle = '#e5e5e5';
        ctx.setLineDash([0]);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x, y, canvasChartGrid.width, canvasChartGrid.height); 
        
        let factLineCapacity = lineCapacity / Math.floor((lineCapacity * timeTradingInterval) / totalTime); // 14 points, scale = 1
        let lineInterval = (rectangleWidth + rectangleSpace) * lineCapacity / factLineCapacity; // 100px, scale = 1

        for (let j = Math.floor(factLineCapacity); j >= 0; j--){
            let xPosition = getXPosition(canvasChartGrid, rectangleInterval, rectangleWidth);
            ctx.beginPath();
            ctx.moveTo(xPosition, y);
            ctx.lineTo(xPosition, canvasChartGrid.height);
            ctx.stroke();
            rectangleInterval += lineInterval;
        }
        for (let j = stepY; j <= canvasChartGrid.height; j += stepY){
            ctx.beginPath();
            ctx.moveTo(x, lineWidthAlign + j);
            ctx.lineTo(canvasChartGrid.width, lineWidthAlign + j);
            ctx.stroke();
        }
    }
    function drawRateChart(ctx, canvasElem) { 
        let rectangleInterval = rectangleWidth + rectangleSpace;
        let rectangleCapacity = Math.ceil((canvasElem.clientWidth / (rectangleWidth + rectangleSpace)) / scale);
        let deltaCheckPoint = Math.round(Number(rectangleWidth * scale + rectangleSpace * scale).toFixed(2));
        let scaleCheckPoint = parsedRUBInfo['o'].length - rectangleCapacity;
        
        deltaIntervalLeft = delta - shiftX;
        deltaIntervalRight = shiftX - delta;
        
        while (deltaIntervalLeft >= deltaCheckPoint && startRatePoint < scaleCheckPoint) {
            startRatePoint++;
            shiftX += Math.round(rectangleInterval * scale);
            deltaIntervalLeft = delta - shiftX;
        }
        while (deltaIntervalRight > 0 && startRatePoint > 0) {
            startRatePoint--;
            shiftX -= Math.round(rectangleInterval * scale);
            deltaIntervalRight = shiftX - delta;
        }
        
        let sumTotalRectangles = parsedRUBInfo['o'].length - startRatePoint - rectangleCapacity;
        
        let parsedRUBInfoArrayOpen = []; // Open Rate array
        getRateData(parsedRUBInfo['o'], parsedRUBInfoArrayOpen, rectangleCapacity, sumTotalRectangles);
        let parsedRUBInfoArrayClose = []; // Close Rate array
        getRateData(parsedRUBInfo['c'], parsedRUBInfoArrayClose, rectangleCapacity, sumTotalRectangles);
        let parsedRUBInfoArrayLow = []; // Low Rate array
        getRateData(parsedRUBInfo['l'], parsedRUBInfoArrayLow, rectangleCapacity, sumTotalRectangles);
        let parsedRUBInfoArrayHigh = []; // High Rate array
        getRateData(parsedRUBInfo['h'], parsedRUBInfoArrayHigh, rectangleCapacity, sumTotalRectangles);
        
        let totalRateData = parsedRUBInfoArrayOpen.concat(parsedRUBInfoArrayClose).concat(parsedRUBInfoArrayLow).concat(parsedRUBInfoArrayHigh);

        let maxRateArray = Math.max.apply(Math, totalRateData);
        let minRateArray = Math.min.apply(Math, totalRateData);
        
        let deltaRate = maxRateArray - minRateArray;

        drawRateMarkupAxis(totalRateData);
        drawTradingTimeAxis(rectangleCapacity, sumTotalRectangles);
        drawGrid(ctx, rectangleCapacity);

        for (let j = rectangleCapacity - 1; j >= 0; j--) {
            let openRate = parsedRUBInfoArrayOpen[j];
            let closeRate = parsedRUBInfoArrayClose[j];
            
            let deltaCloseOpenRate = Math.abs(openRate - closeRate);

            let lowRate = parsedRUBInfoArrayLow[j];
            let highRate = parsedRUBInfoArrayHigh[j]; 

            let deltaOpenMinRate = openRate - minRateArray;
            let deltaCloseMinRate = closeRate - minRateArray;
        
            if (deltaCloseMinRate > deltaOpenMinRate) { 
                defineRectangleCoordinates(deltaCloseMinRate, '#00FF00');
            }
            else {
                defineRectangleCoordinates(deltaOpenMinRate, '#FF0000');
            }
            rectangleInterval += rectangleSpace + rectangleWidth;
            function defineRectangleCoordinates(deltaMinRate, rectangleColor) {
                ctx.setLineDash([0]);
                ctx.strokeStyle = '#808080';

                let rectX = Math.round(canvasElem.width - Math.round(rectangleInterval * scale) + delta - shiftX);
                let rectY = Math.round(canvasElem.height - (deltaMinRate * canvasElem.height) / deltaRate);
                let rectW = Math.round(rectangleWidth * scale);
                let rectH = Math.round((canvasElem.height * deltaCloseOpenRate) / deltaRate);
                
                let wickX = getXPosition(canvasElem, rectangleInterval, rectangleWidth);
                let wickY = Math.round(canvasElem.height - ((canvasElem.height * (highRate - minRateArray)) / deltaRate));
                let wickH = Math.round(canvasElem.height - ((canvasElem.height * (lowRate - minRateArray)) / deltaRate));
                
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.lineTo(wickX, wickH);
                ctx.stroke();

                ctx.fillStyle = rectangleColor;
                ctx.fillRect(rectX, rectY, rectW, rectH);
                
                // to improve code!!!
                const scaleMAX = 0.2375;
                if (scale > scaleMAX) {
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(rectX + lineWidthAlign, rectY + lineWidthAlign, rectW, rectH);  
                }
            }
        }
    }
    function getRateData(rates, rateData, capacity, total) {
        let rectangleCapacity = capacity;
        let sumTotalRectangles = total;
        while(rectangleCapacity) {
            rateData.push(rates[sumTotalRectangles]);
            sumTotalRectangles++;
            rectangleCapacity--;
        }
    }
    function drawRateMarkupAxis(rateMaxMinData) {
        let canvasChartAxisY = document.getElementById('chart_markup_price_axis');
        let ctx = canvasChartAxisY.getContext('2d');
        canvasChartAxisY.height = canvasChartGrid.height;
        canvasChartAxisY.width = 50;
        drawPrices(ctx, canvasChartAxisY, rateMaxMinData);
    }   
    function drawPrices(ctx, canvasElem, rateMaxMinData) {
        const maxScale = 0.135;
        let rateInterval = 0;
        let ratePositionX = canvasElem.width * 0.125;
        let lineLength = canvasElem.width * 0.05;
        
        let maxRate = Math.max.apply(Math, rateMaxMinData);
        let minRate = Math.min.apply(Math, rateMaxMinData);
        
        let deltaRate = maxRate - minRate; 
        
        if (deltaRate < maxScale) {
            rateInterval = Number((canvasElem.height / 100) * Number(deltaRate).toFixed(3) / 100).toFixed(3);
        }
        else {
            rateInterval = Math.floor(canvasElem.height / 100 * deltaRate) / 100;
        }

        let totalRatePoints = deltaRate / rateInterval;
        stepY = Math.round(canvasElem.height / totalRatePoints); 

        ctx.strokeStyle = '#606060';
        for (let j = 0; j < canvasElem.height; j += stepY) {
            ctx.beginPath();
            ctx.moveTo(x, j + lineWidthAlign);
            ctx.lineTo(lineLength + lineWidthAlign, j + lineWidthAlign);
            ctx.stroke();            

            ctx.fillStyle = "#606060";
            ctx.textAlign = 'medium';
            ctx.font = "11px Arial";
            ctx.fillText(maxRate.toPrecision(5), ratePositionX, j + 5);
            maxRate -= rateInterval;
        }
    }
    function drawTradingTimeAxis(tradingTimeCapacity, totalTradingTimePoints) {
        let canvasChartAxisX = document.getElementById('chart_markup_date_axis'); 
        let ctx = canvasChartAxisX.getContext('2d');
        canvasChartAxisX.width = canvasChartGrid.width;
        canvasChartAxisX.height = 20;
        drawTime(ctx, canvasChartAxisX, tradingTimeCapacity, totalTradingTimePoints);
    }
    function drawTime(ctx, canvasElem, tradingTimeCapacity, totalTradingTimePoints) {
        const tradingTimeInterval = 5;
        const totalTime = 60;
        let rectangleInterval = rectangleWidth + rectangleSpace;
        let timePositionY = canvasElem.height * 0.7;
        let lineLength = canvasElem.height * 0.1;
        ctx.strokeStyle = '#606060';
        ctx.fillStyle = "#505050";

        // Get time data based on the rectangleCapacity on clientWidth;
        let parsedRUBInfoTime = []; 
        getRateData(parsedRUBInfo['t'], parsedRUBInfoTime, tradingTimeCapacity, totalTradingTimePoints);      
    
        let timePointStep = Math.floor((tradingTimeCapacity * tradingTimeInterval) / totalTime); // 2 
        let factTradingTimeCapacity = tradingTimeCapacity / timePointStep; // 14.5 points
        let timeTradingPointsInterval = (rectangleWidth + rectangleSpace) * tradingTimeCapacity / factTradingTimeCapacity; // 100px
        let i = 0;

        for (let j = Math.floor(factTradingTimeCapacity); j >= 0; j--) {
            let timePositionX = getXPosition(canvasElem, rectangleInterval, rectangleWidth);
        
            ctx.beginPath();
            ctx.moveTo(timePositionX, y); 
            ctx.lineTo(timePositionX, lineLength + lineWidthAlign);
            ctx.stroke();

            let time = new Date(parsedRUBInfoTime[Math.floor(tradingTimeCapacity - 1 - i)] * 1000);
            let hours = time.getHours().pad(2);
            let minutes = time.getMinutes().pad(2);
            let tradingTime = `${hours}:${minutes}`;
            
            ctx.font = "11px Arial";
            if (hours === '00' && minutes === '00') {
                ctx.font = 'bold 12px Arial';
                const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                let month = monthName[time.getMonth()];
                let day = time.getDate().pad(2);
                tradingTime = `${month}, ${day}`;
            }
            ctx.fillText(tradingTime, timePositionX, timePositionY);
            i += timePointStep;
            rectangleInterval += timeTradingPointsInterval;     
        }
    }
    function getXPosition(canvasElem, rectangleInterval, rectangleWidth) {
        let xPosition = lineWidthAlign + canvasElem.width - Math.round((rectangleInterval - rectangleWidth / 2) * scale) + delta - shiftX;
        return xPosition;
    }
    window.addEventListener('resize', resizeChart);
    function resizeChart(event) {
        canvasChartGrid.width = event.clientWidth;
        drawRUBCurrencyPage();
    }
    Number.prototype.pad = function(size) {
        let s = String(this);
        while (s.length < (size || 2)) {
            s = "0" + s;
        }
        return s;
    }
    drawRUBCurrencyPage();
}
loadRUBData(); 