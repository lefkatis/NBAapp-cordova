$(document).on("ready",function (event) {    
    
    var currentDate = new Date($.now()),
        // serverFileName = "APIData.php",
        serverFileName = "https://www.lefkatis.com/nba/APIData.php",
        scheduleJSON = "jsonFiles/scheduleJSON.json",
        scoreJSON = "jsonFiles/scoreJSON.json",
        teamsJSON = "jsonFiles/teamsJSON.json",
        teamJSON = "jsonFiles/spursJSON.json",

        imagePath = window.location.origin + "/nba/images/teams/",
        errorImagePath = window.location.origin + "/nba/images/error.png",

        teamsDataFetched = false;

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

    var spinnerStandings = new Spinner(opts2); 
    var spinnerTeams = new Spinner(opts2);
    var spinnerTeam = new Spinner(opts2);
// -----------TEAMS PAGE---------------------------------------------------------------------------------------------
    
    // if (($.mobile.activePage.attr('id')=='teamsPage') || ($.mobile.activePage.attr('id')=='teamPage') || ($.mobile.activePage.attr('id') =='standingsPage')) {
    if (!teamsDataFetched){
        spinnerStandings.spin(document.getElementById('standingsPage'));
        spinnerTeams.spin(document.getElementById('teamsPage'));
        var getTeams = $.ajax({
                type: "POST",
                dataType: "json",
                url: serverFileName,
                data: {"action": "teams"}
            });
            getTeams.done(function (data) {
                //STANDINGS
                console.log('Teams Loaded');
                data = teamsHasData(data);
                $("#offlineStandingsError").hide();
                if(typeof(Storage) !== "undefined") {
                    localStorage.setItem("standingsData", JSON.stringify(data));
                }   
                teamsDataFetched = true;
            });
            getTeams.fail(function ( jqXHR, textStatus, errorThrown){
                console.log(errorThrown);
                console.log("Failed to load Teams");   
                //checking if offline data is stored
                if(typeof(Storage) !== "undefined"){ 
                    if (localStorage.standingsData){
                        teamsHasData(JSON.parse(localStorage.standingsData));
                        $("#offlineStandingsError").show();
                    }
                    else{
                        $('#standingsTable').hide();
                        $("#teams-list").hide();
                        $('.ui-filterable').hide();
                        $('.error').empty();
                        $('.error').append('Failed to retreive teams</br>Please check your internet connection or refresh');
                    }
                }
            });
            getTeams.always(function(){
                $("img").error(function () {
                    $(this).attr("src", errorImagePath);
                });
                spinnerTeams.stop(spinner);
                spinnerStandings.stop(spinner);
        });
    }
    // }
    // if ($.mobile.activePage.attr('id')=='standingsPage'){
    if ($("#easternTable").css('display') == 'none') {
        $('#easternNav').removeClass('ui-btn-active');
        $('#westernNav').addClass('ui-btn-active');
    }
    // }
    $(document).on("pagebeforeshow", function(){
        if ($.mobile.activePage.attr('id')=='teamPage'){
            if (location.hash !== "#teamPage"){
                teamID = location.hash.split("?")[1].replace("id=", "");
                page = location.hash.split("?")[2].replace("page=", "");
                teamName = location.hash.split("?")[3].replace("name=", "");
                redirectToTeam(teamID, page, teamName);    
            }
        }
    });


    function teamsHasData(data) {
        $('error').empty();
        $('#standingsTable').show();
        $('.ui-filterable').show();
        data = modifyTeamsData(data);
        configureStandingsTables();
        setEasternTable(data.conferences[0]);
        setWesternTable(data.conferences[1]);
        //TEAMS LIST
        //get template and render, get the list, fill it and refresh
        var teamsHTMLData = Mustache.render($('#tmpl-teams').html(), data);
        $("#teams-list").html(teamsHTMLData);
        if ( $($("#teams-list")).hasClass('ui-listview')) {
            $("#teams-list").show();
            $($("#teams-list")).listview('refresh');
        }
        else 
            $($("#teams-list")).trigger('create');   

        if(typeof(Storage) !== "undefined") {
            if (localStorage.favouriteTeam){
                $("#team" + localStorage.favouriteTeam +" a").css("background-color", "#FFCC66"); 
                $("#standing" + localStorage.favouriteTeam).css("background-color", "#FFCC66","text-shadow","none"); 
            }
        }
        return data;
    }

    function modifyTeamsData (data){
        var iE=0, iW=0, i;
        var last_10;
        var division, conference;
        console.log(data);
        data.conferences[1].teams = [];
        data.conferences[0].teams = [];
        data.conferences[0].teamsSorted = [];
        data.conferences[1].teamsSorted = []; 
        $.each(data.conferences, function() {
            conference = this;
          $.each(this.divisions, function() {
            division = this;
            $.each(this.teams, function() {
                if (conference.alias == "WESTERN"){
                    data.conferences[1].teams[iW] = this;
                    data.conferences[1].teamsSorted[iW] = this; 
                    iW = iW + 1;
                }else {
                    data.conferences[0].teams[iE] = this; 
                    data.conferences[0].teamsSorted[iE] = this; 
                    iE = iE + 1;
                }
                $.each(this.records, function() {
                    if (this.record_type == "last_10")
                        last_10 = this.wins +"-" + this.losses;
                });
                this["last_10"] = last_10;
                this["imagePath"] = imagePath;
                this["division"] = division.name;
             });
          });
        }); 
        $.each(data.conferences, function() {
            this['teams'].sort(function(a,b) { return parseFloat(b['win_pct']) - parseFloat(a['win_pct']) } );
            this['teamsSorted'].sort(function(a,b) { return a.market.localeCompare(b.market) } );
            i = 1;
            $.each(this.teams, function() {
                this['pos'] = i;
                i= i + 1;
            });
        });
        return data;
    }

    $('#refreshStandings').on('click', function() {
        window.location.reload(true);
    });

    $('#refreshTeams').on('click', function() {
        window.location.reload(true);
    });

    //When onCLick on a Team
    $("#teams-list").on("click", "li", function(e) {
        teamID = $(this).attr("data-id");
        teamName = $(this).find('a').find('h2').html();
        redirectToTeam(teamID, "teamsPage", teamName);
    });

// -----------STANDINGS TABLE CONFIFURATION---------------------------------------------------------------------------------------------

    function configureStandingsTables(){
        $("#westernTable").hide();
        $("#easternNav").on('click', function () {
            $("#westernTable").hide();
            $("#easternTable").show();
        });
        $("#westernNav").on('click', function () {
            $("#easternTable").hide();
            $("#westernTable").show();
        });
    }

    function setWesternTable(westernData){
        //wester table //get template and render
        var tmplWStandings = $('#tmpl-wStandings').html();
        var wStandingsHTMLData = Mustache.render(tmplWStandings, westernData);
        //get table and fill it
        $("#westernTable").append(wStandingsHTMLData);   
    }

    function setEasternTable(easternData){
        //easter table //get template and render
        var tmplEStandings = $('#tmpl-eStandings').html();
        var eStandingsHTMLData = Mustache.render(tmplEStandings, easternData);
        //get table and fill it
        $("#easternTable").append(eStandingsHTMLData);  
    }

    $("#standingsTable").on("click", "td a", function(e) {
        teamID = $(this).attr("data-id");
        teamName = $(this).html();
        redirectToTeam(teamID, "standingsPage", teamName);    
    });


// -----------TEAM PAGE---------------------------------------------------------------------------------------------

    function redirectToTeam(teamID, page){
        $("#teamDetails").empty();
        $("#teamRoster").empty();
        spinnerTeam.spin(document.getElementById('teamPage'));
        var getTeam = $.ajax({
                type: "POST",
                dataType: "json",
                contentType:"text/plain",
                url: serverFileName,
                data: {"action": "team", "teamID": teamID}
            });
            getTeam.done(function (data){
                data = modifyTeamData(data);
                changeBackgroundColor(data);
                $('.error').empty();    
                //get template and render it with json data, add data to html and refresh
                var teamHTMLData = Mustache.render($('#tmpl-team').html(), data);
                $("#teamDetails").append(teamHTMLData).trigger('create');
                //get template and render it with json data, add data to html and refresh
                var teamHTMLRosterData = Mustache.render($('#tmpl-roster').html(), data);
                $("#teamRoster").append(teamHTMLRosterData).trigger('create');

                //get the search function ready
                generateSearch();
                //configure back button
                $("#backButton").attr({href: "#"+page});
                $('#teamPage').find('header').find('h1').html(teamName)
                if(typeof(Storage) !== "undefined") {
                    if (localStorage.favouriteTeam){
                        if (localStorage.favouriteTeam == $('#teamDetails p').attr('data-id'))
                            $('#favourite').buttonMarkup({theme: 'a'});
                        else
                            $('#favourite').buttonMarkup({theme: 'b'}); 
                    }
                }
                $('#favourite').show();
            });
            getTeam.fail(function(){
                console.log('Failed to load Team'); 
                $('#errorTeam').empty();
                $('#errorTeam').append('Failed to retreive team</br>Please check your internet connection or refresh');
                $('#errorTeam').show();
                $('#favourite').hide();
                
            });
            getTeam.always(function(){
                var urlComponent = $(location).attr("hash").split("?");
                if (urlComponent.length == 1)
                    window.location.replace(window.location.href+"?id=" + teamID +"?page="+page +"?name=" + teamName);
                $("img").error(function () {
                    $(this).attr("src", errorImagePath);
                });
                spinnerTeam.stop(spinner);
            });
    }

    function highlightFavouriteTeam(remove){
        if (!remove){
            $("#team" + localStorage.favouriteTeam +" a").css("background-color", "#FFCC66");
            $("#standing" + localStorage.favouriteTeam).css("background-color", "#FFCC66","text-shadow","none");
            $('#'+localStorage.favouriteTeam).parent().css("background-color", "#FFCC66", "text-shadow","none");
        } else {
            $("#team" + localStorage.favouriteTeam +" a").css("background-color", "");
            $("#standing" + localStorage.favouriteTeam).css("background-color", "","text-shadow","0 1px 0 #f3f3f3");
            $('#'+localStorage.favouriteTeam).parent().css("background-color", "", "text-shadow","0 1px 0 #f3f3f3");
        }

    }
    
    $("#favourite").on("click", function(event) {
        // console.log('fav clicked' + localStorage.favouriteTeam);
        if(typeof(Storage) !== " undefined") {
            if (localStorage.favouriteTeam){
                if (localStorage.favouriteTeam == location.hash.split("?")[1].replace("id=", "")){
                    //remove the team from favourite
                    $(this).buttonMarkup({theme: 'b'});
                    highlightFavouriteTeam(true);
                    localStorage.removeItem("favouriteTeam");
                } else {
                    //set new team as favourite
                    $(this).buttonMarkup({theme: 'a'});
                    highlightFavouriteTeam(true);
                    localStorage.setItem("favouriteTeam", location.hash.split("?")[1].replace("id=", ""));
                    highlightFavouriteTeam(false);
                }
            } else{
                //set the team as favourite
                $(this).buttonMarkup({theme: 'a'});
                localStorage.setItem("favouriteTeam", location.hash.split("?")[1].replace("id=", ""));
                highlightFavouriteTeam(false);
            }
        }
    });

    function generateSearch() {
        // Search For Players or coaches
        $("#teamRoster").on("click", "td a", function(e) {
            var playerName = $(this).attr("data-id");
            $("#googleSearch").attr({
                href: 'https://www.google.co.uk/search?q='+playerName
            });
            $("#wikiSearch").attr({
                href: 'http://en.wikipedia.org/w/index.php?search='+playerName
            });
            $("#nbaSearch").attr({
                href: 'http://www.nba.com/search/?text='+playerName
            });
        });
        $("#teamDetails").on("click", "p a", function(e) {
            if (this.className == "coach ui-link"){
                var coachName = $(this).attr("data-id");
                $("#googleSearch").attr({
                    href: 'https://www.google.co.uk/search?q='+coachName
                });
                $("#wikiSearch").attr({
                    href: 'http://en.wikipedia.org/w/index.php?search='+coachName
                });
                $("#nbaSearch").attr({
                    href: 'http://www.nba.com/search/?text='+coachName
                });
            }
            else{
                var search = $(this).attr("data-id");
                var query = search.replace("&", " ");
                var htmlFrame = '<iframe id="map" style="border:0;width: 100%;"height="350" align="middle" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q='+query+'&key=AIzaSyB6K50aGW8DwZNm5mResWxAqXjBdbR015M"></iframe>';
                $("#mapContainer").empty();
                $("#mapContainer").append(htmlFrame);
                $("#mapPopup div h1").html($(this).html());    
                $("#mapPopup").trigger('refresh');    
            }
        });
    }

    function modifyTeamData(data){
        //change name of conference
        if (data.conference.alias == "WESTERN")
            data.conference.alias = "Western";
        else
            data.conference.alias= "Eastern";
        //add record to json file 
        //data["record"] = $("."+teamID+'record').text();
        data['imagePath']=imagePath;
        //generate the years in nba
        $.each(data.players, function(i) {
            if (typeof this.draft !== 'undefined')
                this.draft.year = currentDate.getUTCFullYear() - parseInt(this.draft.year);
        });

        return data;
    }

    function changeBackgroundColor(data){
        var blue = "#B2CCFF",
            red='#FFB2B2',
            gray = '#E0E0E0', 
            green = '#85E085', 
            orange = '#FFC266',
            yellow = '#FFFFB2'; 

        switch(data.id) {
            case "583ecb8f-fb46-11e1-82cb-f4ce4684ea4c": //atlanta
                $("#teamPage").css("background-color",red);
                break;
            case "583ec8d4-fb46-11e1-82cb-f4ce4684ea4c": //wizards
                $("#teamPage").css("background-color",red);
                break;
            case "583ecea6-fb46-11e1-82cb-f4ce4684ea4c": //heat
                $("#teamPage").css("background-color",red);
                break;
            case "583ec97e-fb46-11e1-82cb-f4ce4684ea4c": //hornets
                $("#teamPage").css("background-color", blue);
                break;
            case "583ed157-fb46-11e1-82cb-f4ce4684ea4c": //magic
                $("#teamPage").css("background-color",blue);
                break;
            case "583ecda6-fb46-11e1-82cb-f4ce4684ea4c": //raptors
                $("#teamPage").css("background-color",red);
                break;
            case "583ec9d6-fb46-11e1-82cb-f4ce4684ea4c": //nets
                $("#teamPage").css("background-color",gray);
                break;
            case "583eccfa-fb46-11e1-82cb-f4ce4684ea4c": //celtics
                $("#teamPage").css("background-color",green);
                break;
            case "583ec87d-fb46-11e1-82cb-f4ce4684ea4c": //76ers
                $("#teamPage").css("background-color",blue);
                break;
            case "583ec70e-fb46-11e1-82cb-f4ce4684ea4c": //knicks
                $("#teamPage").css("background-color",orange);
                break;
            case "583ec773-fb46-11e1-82cb-f4ce4684ea4c": //cavs
                $("#teamPage").css("background-color",red);
                break;
            case "583ec5fd-fb46-11e1-82cb-f4ce4684ea4c": //bulls
                $("#teamPage").css("background-color",red);
                break;
            case "583ecefd-fb46-11e1-82cb-f4ce4684ea4c": //bucks
                $("#teamPage").css("background-color",green);
                break;
            case "583ec7cd-fb46-11e1-82cb-f4ce4684ea4c": //pacers
                $("#teamPage").css("background-color",yellow);
                break;
            case "583ec928-fb46-11e1-82cb-f4ce4684ea4c": //pistons
                $("#teamPage").css("background-color",blue);
                break;
            case "583ecb3a-fb46-11e1-82cb-f4ce4684ea4c": //rockets
                $("#teamPage").css("background-color",red);
                break;
            case "583eca88-fb46-11e1-82cb-f4ce4684ea4c": //grizzlies
                $("#teamPage").css("background-color",blue);
                break;
            case "583ecd4f-fb46-11e1-82cb-f4ce4684ea4c": //spurs
                $("#teamPage").css("background-color",gray);
                break;
            case "583ecf50-fb46-11e1-82cb-f4ce4684ea4c": //mavericks
                $("#teamPage").css("background-color",blue);
                break;
            case "583ecc9a-fb46-11e1-82cb-f4ce4684ea4c": //pelicans
                $("#teamPage").css("background-color",blue);
                break;
            case "583ed056-fb46-11e1-82cb-f4ce4684ea4c": //blazers
                $("#teamPage").css("background-color",red);
                break;
            case "583ecfff-fb46-11e1-82cb-f4ce4684ea4c": //thunder
                $("#teamPage").css("background-color",orange);
                break;
            case "583ece50-fb46-11e1-82cb-f4ce4684ea4c": //jazz
                $("#teamPage").css("background-color",blue);
                break;
            case "583ed102-fb46-11e1-82cb-f4ce4684ea4c": //nuggets
                $("#teamPage").css("background-color",yellow);
                break;
            case "583eca2f-fb46-11e1-82cb-f4ce4684ea4c": //timberwolves
                $("#teamPage").css("background-color",green);
                break;
            case "583ec825-fb46-11e1-82cb-f4ce4684ea4c": //warriors
                $("#teamPage").css("background-color",yellow);
                break;
            case "583ecdfb-fb46-11e1-82cb-f4ce4684ea4c": //clippers
                $("#teamPage").css("background-color",red);
                break;
            case "583ecfa8-fb46-11e1-82cb-f4ce4684ea4c": //suns
                $("#teamPage").css("background-color",orange);
                break;
            case "583ed0ac-fb46-11e1-82cb-f4ce4684ea4c": //kings
                $("#teamPage").css("background-color",blue);
                break;
            case "583ecae2-fb46-11e1-82cb-f4ce4684ea4c": //lakers
                $("#teamPage").css("background-color",yellow);
                break;
            default:
                break;
        }
    }
});