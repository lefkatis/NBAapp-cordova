$(document).on("ready",function (event) {    

    var months = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
    var days = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
    var currentDate = new Date($.now()),
        //serverFileName = "APIData.php",
        serverFileName = "https://www.lefkatis.com/nba/APIData.php",
        BASE_URL = "https://lefkatis.com/nba/",
        scheduleJSON = "jsonFiles/scheduleJSON.json",
        scoreJSON = "jsonFiles/scoreJSON.json",
        imagePath = BASE_URL + "/images/teams/",
        errorImagePath = BASE_URL + "/images/error.png",
        teamsJSON = "jsonFiles/teamsJSON.json",
        teamJSON = "jsonFiles/spursJSON.json";    

    currentDate.setHours(currentDate.getHours() - 7);
    console.log(currentDate);
    var currentDateUTC = currentDate.getUTCDate() + " " + currentDate.getUTCMonth() + " " + currentDate.getUTCFullYear();
    var pageDate = currentDate;
    
    var opts = {
      lines: 10, // The number of lines to draw
      length: 7, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 58, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 0.9, // Rounds per second
      trail: 100, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '7em', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };

    var opts2 = {
      lines: 10, // The number of lines to draw
      length: 7, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 58, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 0.9, // Rounds per second
      trail: 100, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '18em', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };
    
// -----------OTHER---------------------------------------------------------------------------------------------
    
    $('#refresh').on('click', function() {
        window.location.reload(true);
    });

    var spinnerScores = new Spinner(opts);    
    
    $('#share').hide();
    // $('#calendar').hide();
    $('#refreshScores').hide();

    console.log(checkAppCache());
    function checkAppCache(){
        switch (window.applicationCache.status) {
          case window.applicationCache.UNCACHED: // UNCACHED == 0
            return 'Cache is UNCACHED';
            break;
          case window.applicationCache.IDLE: // IDLE == 1
            return 'Cache is IDLE';
            break;
          case window.applicationCache.CHECKING: // CHECKING == 2
            return 'Cache is CHECKING';
            break;
          case window.applicationCache.DOWNLOADING: // DOWNLOADING == 3
            return 'Cache is DOWNLOADING';
            break;
          case window.applicationCache.UPDATEREADY:  // UPDATEREADY == 4
            return 'Cache is UPDATEREADY';
            break;
          case window.applicationCache.OBSOLETE: // OBSOLETE == 5
            return 'Cache is OBSOLETE';
            break;
          default:
            return 'UKNOWN CACHE STATUS';
            break;
        };
    }
    
// -----------GET SCHEDULE--------------------------------------------------------------------------------------------- 

    var spinnerSchedule = new Spinner(opts2).spin(document.getElementById('schedule'));

    var getSchedule = $.ajax({
            type: "POST",
            dataType: "json",
            url: serverFileName,
            data: {"action": "schedule"}
        });
    getSchedule.done(function (data) {
        $("#offlineScheduleError").hide();
        data = scheduleHasData(data);
        console.log('Schedule Loaded');
        //setting offline data
        if(typeof(Storage) !== "undefined") {
            localStorage.setItem("scheduleData", JSON.stringify(data));
        }
    });
    getSchedule.fail(function ( jqXHR, textStatus, errorThrown){
        console.log(errorThrown);
        //checking if offline data is stored
        if(typeof(Storage) !== "undefined") {
            if (localStorage.scheduleData){
                $("#offlineScheduleError").show();
                scheduleHasData(JSON.parse(localStorage.scheduleData));
                console.log("Failed to load Schedule, offline"); 
            }
            else{
                $("#schedule article").empty();
                $('#schedule article').append('<h3>Failed to retreive games</br>Please check your internet connection and try again</h3>');         
                console.log("failed to retreive schedule");  
            }
        }
    });
    getSchedule.always(function () {
        $("img").error(function () {
            $(this).attr("src", errorImagePath);
        });
        spinnerSchedule.stop(spinner);
        $.mobile.loading( 'hide' );
        if ($.mobile.activePage.attr('id') == 'splashPage')
            $.mobile.changePage($("#schedule"), { transition: "slideup"});
        $('#share').show();
        // $('#calendar').show();  
    });

    function scheduleHasData (data){
        //setup buttons
        $('#previousDayButton').click(function(){ previousDay(data); return false; });
        $('#nextDayButton').click(function(){ nextDay(data); return false; });
        //get data for current date
        data = modifyData(data);
        getPlayoffData(data)
        //get games for current date
        var daysGames = generateDaySchedule(currentDateUTC, data);
        //render and show
        renderAndShow(currentDate, daysGames);
        getScores(data, currentDateUTC);

        $('#refreshScores').unbind('click');
        $("#refreshScores").on('click', function() {
            getScores(data, currentDateUTC);
        });

        //add swipes to the page to cahnge the days
        $( document ).on( "swiperight", '#schedule', function() {
            $.mobile.changePage( "#schedule", { allowSamePageTransition: true, transition:"slide", reverse:"true" } );
            previousDay(data);
        });
        
        $( document ).on( "swipeleft", '#schedule', function() {
            $.mobile.changePage( "#schedule", { allowSamePageTransition: true, transition:"slide" } );
            nextDay(data);
        });
        return data;
    }


    function getPlayoffData (scheduleData){
        var newScheduleData;
        var getPlayoffs = $.ajax({
                type: "POST",
                dataType: "json",
                url: serverFileName,
                data: {"action": "playoffs"}
            });
        getPlayoffs.done(function (data) {
            //add playoff games to data
            console.log("Playoffs loaded");  
            newScheduleData = modifyPlayoffsData(data, scheduleData);
            
            //update Playoff games
            var daysGames = generateDaySchedule(currentDateUTC, newScheduleData);
            //render and show
            console.log(currentDate);
            renderAndShow(currentDate, daysGames);
            getScores(data, currentDateUTC);

            if(typeof(Storage) !== "undefined") {
                localStorage.setItem("scheduleData", JSON.stringify(newScheduleData));
            }
        });
        getPlayoffs.fail(function (request, status, error){
            console.log(error);
            newScheduleData = scheduleData;
            console.log("Failed to retreive Playoffs");  
        });
        getPlayoffs.always(function () {
            $("img").error(function () {
                $(this).attr("src", errorImagePath);
            });
        });
        return newScheduleData;
    }

    function modifyData(data) {
        var date, dateUTC;
        $.each(data.games, function(i) {
            date = new Date(Date.parse(this.scheduled));
            this.schedule = date;
            hoursUTC = date.getHours();
            minutesUTC = date.getMinutes();
            if ((hoursUTC == 0) || (hoursUTC.toString().length == 1))
                hoursUTC = "0" + hoursUTC;
            if (minutesUTC == 0) 
                minutesUTC = minutesUTC + "0";
            timeUTC = date.getUTCHours() + ":" + date.getUTCMinutes();
            tempDate = date;
            tempDate.setHours(tempDate.getHours()-5);
            this["dateUTC"] = tempDate.getUTCDate() + " " + tempDate.getUTCMonth() + " " + tempDate.getUTCFullYear();
            this['timeUTC'] = hoursUTC + ":" + minutesUTC;
            this['imagePath'] = imagePath;
            switch(this.status) {
                case "closed":
                    this.timeUTC = "ENDED";
                    break;
                case "inprogress":
                    this.timeUTC = "NOW";
                    break;
                default:
                    break;
            }
        });
        return data;
    }

    function modifyPlayoffsData(data, scheduleData) {
        var date, dateUTC, serie, i=0;
        data['games'] = [];
        if (data.series !== undefined){
            $.each(data.series, function() {
                serie = this;
                $.each(this.games, function() {
                    date = new Date(Date.parse(this.scheduled));
                    this.schedule = date;
                    hoursUTC = date.getHours();
                    minutesUTC = date.getMinutes();
                    if ((hoursUTC == 0) || (hoursUTC.toString().length == 1))
                        hoursUTC = "0" + hoursUTC;
                    if (minutesUTC == 0) 
                        minutesUTC = minutesUTC + "0";
                    timeUTC = date.getUTCHours() + ":" + date.getUTCMinutes();
                    tempDate = date;
                    tempDate.setHours(tempDate.getHours()-5);
                    this["dateUTC"] = tempDate.getUTCDate() + " " + tempDate.getUTCMonth() + " " + tempDate.getUTCFullYear();
                    this['timeUTC'] = hoursUTC + ":" + minutesUTC;
                    this['imagePath'] = imagePath;
                    switch(this.status) {
                        case "closed":
                            this.timeUTC = "ENDED";
                            break;
                        case "inprogress":
                            this.timeUTC = "NOW";
                            break;
                        default:
                            break;
                    }
                    scheduleData.games[scheduleData.games.length] = this;
                });
            });
        }
        return scheduleData;
    }
// -----------SHOW SCHEDULE---------------------------------------------------------------------------------------------
    
    function renderAndShow(date, daysGames){
        //get template and render, get the table, fill it and refresh
        var scheduleHTMLData = Mustache.render($('#tmpl-schedule').html(), daysGames);
        //get table and fill it
        $("#gamesContent table").show();
        $("#gamesContent h3").empty();
        $("#gamesTable").empty();
        $('#dateTitleUTC').empty();
        $("#gamesTable").append(scheduleHTMLData); 
        $('#dateTitleUTC').append(days[date.getUTCDay()] + " " + date.getUTCDate() + " " + months[date.getUTCMonth()]);
        if (!(daysGames.games.length >0)){
            $("#gamesContent table").hide();
            $("#gamesContent h3").empty();
            $('#gamesContent h3').append('There are no Games today');
        }
        //change the css of schedule here
        if (typeof(Storage) !== "undefined") {
            if (localStorage.favouriteTeam){
                $('#scheduleTable > tbody  > tr > td').each(function() {
                    if (this.id == localStorage.favouriteTeam){
                        $("#scheduleTable").find(this.parentElement).css("background-color", "#FFCC66", "text-shadow","none");
                    }
                });
            }
        }
    }

    function previousDay(data){
        var daysGames = {games :[]};
        var i = 0;
        pageDate.setDate(pageDate.getDate() - 1);
        pageDateUTC = pageDate.getUTCDate() + " " + pageDate.getUTCMonth() + " " + pageDate.getUTCFullYear();
        $.each(data.games, function() {
            if (pageDateUTC === this["dateUTC"]){
                daysGames.games[i] = this;
                i = i + 1;
            }
        });
        renderAndShow(pageDate, daysGames);
        getScores(data, pageDateUTC);
        $('#refreshScores').unbind('click');
        $("#refreshScores").on('click', function() {
            getScores(data, pageDateUTC);
        });
        return true;
    }

    function nextDay(data) {
        var daysGames = {games :[]};
        var i = 0;
        pageDate.setDate(pageDate.getDate() + 1);
        pageDateUTC = pageDate.getUTCDate() + " " + pageDate.getUTCMonth() + " " + pageDate.getUTCFullYear();
        $.each(data.games, function() {
            if (pageDateUTC === this["dateUTC"]){
                daysGames.games[i] = this;
                i = i + 1;
            }
        });
        renderAndShow(pageDate, daysGames);
        getScores(data, pageDateUTC);
        $('#refreshScores').unbind('click');
        $("#refreshScores").on('click', function() {
            getScores(data, pageDateUTC);
        });
        return true;
    }

    function generateDaySchedule(date, data){
        var daysGames = {games :[]};
        var i = 0
        $.each(data.games, function() {
            if (date === this["dateUTC"]){
                daysGames.games[i] = this;
                i = i + 1;
            }
        });
        return daysGames
    }

// -----------GET SCORE---------------------------------------------------------------------------------------------

    function getScores(data, date){
        scoreGames = [];
        var i=0;
        $.each(data.games, function() {
            //setInterval(function(){
                if (date === this["dateUTC"]){
                    console.log("THIS IS THE DATE EMPIKE "+ date);
                    switch(this.status) {
                        case "closed":
                            scoreGames[i] = this;
                            i=i+1;  
                            //getScore(this.id); //if API calls per second more than one uncomment
                            break;
                        case "inprogress":
                            //getScore(this.id); //if API calls per second more than one uncomment
                            scoreGames[i] = this;
                            i=i+1;  
                            break;
                        case "complete":
                            //getScore(this.id); //if API calls per second more than one uncomment
                            scoreGames[i] = this;
                            i=i+1;  
                            break;
                        case "halftime":
                            //getScore(this.id); //if API calls per second more than one uncomment
                            scoreGames[i] = this;
                            i=i+1;  
                            break;
                        case "cancelled":
                            $('#'+this.id).html('vs</br><b>CANCEL</b>');
                            break;
                        default:
                            break;
                    }
                }
            //}, 1000);
        });
        //way to overpass API calls equal to 1 per second delete if API calls per second more than one
        //added interval to handle api calls to make them one per second
        var j = 0;
        if (scoreGames.length>0){
            var hasGames = true;
            spinnerScores.spin(document.getElementById('schedule'));
            $('#refreshScores').hide();
            var interval = setInterval(function(){
                if (hasGames) {
                    console.log("THERE ARE GAMES");
                    if (scoreGames[j] !== undefined){
                        if (scoreGames[j].status == 'inprogress')
                            $('#'+scoreGames[j].id).css('color', "red");
                        else
                            $('#'+scoreGames[j].id).css('color', "black");
                        getScore(scoreGames[j].id);
                    }
                    else{
                        hasGames = false;
                        clearInterval(interval);
                        spinnerScores.stop(spinner);
                        $('#refreshScores').show();
                    }
                    if (scoreGames.length-1 == j){
                        hasGames = false;
                        clearInterval(interval);
                        spinnerScores.stop(spinner);
                        $('#refreshScores').show();
                    }
                    j = j +1;
                }
            }, 1000);
        } else
        console.log("NO GAMES");
    }

    function getScore(gameID){
            var getScore = $.ajax({
                type: "POST",
                dataType: "json",
                url: serverFileName,
                data: {"action": "score", "gameID": gameID}
            });
                getScore.done(function (data) {
                    var score = data.away.points + "-" + data.home.points;
                    setScore(score, gameID);
                });
                getScore.fail(function ( jqXHR, textStatus, errorThrown){
                    console.log(errorThrown);   
                    console.log("Failed to get score");  
                });
    }

    function setScore(score, gameID){
        $('#'+gameID).html('vs</br><b>'+score+'</b>');
    }

// -----------EMAIL---------------------------------------------------------------------------------------------
    function validateEmail(email) {
        if (email === '')
            return false;
        var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailReg.test( email );
    }

    $('#sendEmail').on('click',function() {
        if( validateEmail($('#email').val())) {
            $("#mailPopup").popup("close");
            $("#errorEmail").hide(); 
            sendMessage($('#email').val());
            $('#email').val('');
        }else{
            $("#errorEmail").show(); 
            $("#errorEmail").html("Please input a valid email address"); 
            $('#errorEmail').css({color: 'red'});
        }
    });

    $('#mailPopup').on('afterclose',function() {
        $('div:jqmData(role="footer")').removeClass("ui-fixed-hidden")
        $('div:jqmData(role="footer")').class("ui-footer ui-bar-b ui-footer-fixed slideup")

    });
    
    function extractTable() {
        var emailTable = document.createElement('table');
        emailTable = $("#scheduleTable").clone();
        tds = emailTable.find('tbody').find('tr').find('td');
        tds.each(function(index, val) {
            td = this.childNodes[0];
            if (td.tagName == 'IMG')
                td.remove();
            td = this.childNodes[1];
            if (td != undefined)
                if (td.tagName == 'IMG')
                    td.remove();
        });
        return emailTable.get(0).outerHTML;
    }

    function sendMessage(address) {
        var intro = document.createElement('p');
        intro.innerHTML = "<b>This is the schedule for " + $('#dateTitleUTC').html() + ":</b></br>";
        
        var message = intro.innerHTML + extractTable();
        var sendEmail = $.ajax({
            type: "POST",
            url: serverFileName,
            data: {"action":"email", "address": address, "emailMessage": message } 
        });
            sendEmail.done(function (data) {
                console.log('email sent');
            setTimeout(function () {
                    $("#popupSuccess").popup("open")
                }, 100);
            });
            sendEmail.fail(function (data) {
                console.log('email failed');
                $('#popupMessage').html('Email could not be sent');
                setTimeout(function () {
                    $("#popupSuccess").popup("open")
                }, 100);
            });
    }   


});