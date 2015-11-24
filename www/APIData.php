<?php
header("access-control-allow-origin: *");
	
	$year = "2015";
	$lastYear = "2014";
    $apiV = "3";
    $scheduleKey = "mz929rhgnu86wpnmyxuu9z6d";
    $teamsKey = "8jwyhzyypqgjrrj6chegqg7w";
    $playoffsKey = "6yfcjvbe84g98wp8txz93gnm";


	if (is_ajax()) {
	  if (isset($_POST["action"]) && !empty($_POST["action"])) { //Checks if action value exists
	    $action = $_POST["action"];	    
	    switch($action) { //Switch case for value of action
	      case "schedule": getSchedule($year, $apiV, $scheduleKey); break;
	      case 'playoffs': getPlayoffs($lastYear, $apiV, $playoffsKey); break;
	      case "teams": getTeams($lastYear, $apiV, $teamsKey); break;
	      case "team": getTeam($apiV, $teamsKey); break;
	      case "email": sendMail(); break;
	      case "score": getScore($playoffsKey); break;
	    }
	  }
	}

	function getPlayoffs($year, $apiV, $apiKey){
		$playoffsJSON = file_get_contents("http://api.sportsdatallc.org/nba-t".$apiV."/series".$year."/PST/schedule.json?api_key=".$apiKey);
		//$playoffsJSON = file_get_contents("http://api.sportradar.us/nba-t3/games/2015/REG/schedule.json?api_key=mz929rhgnu86wpnmyxuu9z6d");
		echo $playoffsJSON;
	}

	function sendMail (){
		$message = $_POST["emailMessage"];
	    $address = $_POST["address"];
		$subject = 'NBA Schedule';
		$headers  = 'MIME-Version: 1.0' . "\r\n";
		$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
		$headers .= 'To: <'.$address.'>' . "\r\n";
		$headers .= 'From: Andreas Lefkatis <andreas@lefkatis.com>' . "\r\n";
		$headers .= 'Reply-To: lefkatis@gmail.com' . "\r\n";
		mail($address, $subject, $message, $headers);
		echo 'Email Send';
	}

	// testMailer();
	function testMailer(){
		$subject = 'Birthday Reminders for June3';
		$message = 'message';
		$headers  = 'MIME-Version: 1.0' . "\r\n";
		$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";

		$headers .= 'To:  Andreas Lefkatis <lefkatis@hotmail.com>' . "\r\n";
		$headers .= 'From: Andreas Lefkatis <andreas@lefkatis.com>' . "\r\n";
		$headers .= 'Reply-To: lefkatis@gmail.com' . "\r\n";
		echo 'emailTester sent an email';
		mail($to, $subject, $message, $headers);
	}

	//Function to check if the request is an AJAX request
	function is_ajax() {
	  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
	}
	
	//get the schedule through the API
	function getSchedule($year, $apiV, $apiKey) {
		$scheduleJSON = file_get_contents("http://api.sportsdatallc.org/nba-t".$apiV."/games/".$year."/REG/schedule.json?api_key=".$apiKey);
		echo $scheduleJSON;
	}

	function getScore($apiKey) {
		$gameID = $_POST["gameID"];
		$scoreJSON = file_get_contents("http://api.sportsdatallc.org/nba-t3/games/".$gameID."/boxscore.json?api_key=".$apiKey);
		echo $scoreJSON;
	}

	//get the standings through the API
	function getTeams($year, $apiV, $apiKey) {
		//$standingsJSON = file_get_contents("http://api.sportsdatallc.org/nba-t".$apiV."/seasontd/".$year."/REG/standings.json?api_key=".$apiKey);
		$standingsJSON = file_get_contents("http://api.sportradar.us/nba-t".$apiV."/seasontd/".$year."/REG/standings.json?api_key=".$apiKey);

		echo $standingsJSON;
	}

	//get the team info through the API
	function getTeam($apiV, $apiKey) {
		$teamID = $_POST["teamID"];
		$teamJSON = file_get_contents("http://api.sportsdatallc.org/nba-t".$apiV."/teams/".$teamID."/profile.json?api_key=".$apiKey);
		echo $teamJSON;
	}
?>