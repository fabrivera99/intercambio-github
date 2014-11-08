function delegate_socket_pickup(){
	
	socket.on('add_to_getmypickupplan', 
		function (data)
		{
			console.log("add_to_getmypickupplan.received");
			SONDA_DB_Session.transaction(
				function (tx)
				{
					//TASK_ID, SCHEDULE_FOR, ASSIGNED_BY, ACCEPTED_STAMP, COMPLETED_STAMP, DOC_PARENT, EXPECTED_GPS, POSTED_GPS, 
					//TASK_COMMENTS, TASK_SEQ, TASK_ADDRESS, RELATED_CLIENT_PHONE_1, EMAIL_TO_CONFIRM
					var xdate = getDateTime();
					
					pSQL = "INSERT INTO PICKUP_ROUTE(TASK_ID, SCHEDULE_FOR, ASSIGNED_BY, DOC_PARENT, EXPECTED_GPS, ";
					pSQL += "TASK_COMMENTS, TASK_SEQ, TASK_ADDRESS, RELATED_CLIENT_PHONE_1, EMAIL_TO_CONFIRM, RELATED_CLIENT_NAME, TASK_PRIORITY, TASK_STATUS)";
					pSQL += "VALUES(" + data.row.TASK_ID + ",'"+data.row.SCHEDULE_FOR+"','" + data.row.SCHEDULE_FOR + "'," + data.row.DOC_PARENT;
					pSQL += ", '"+ data.row.EXPECTED_GPS + "','" + data.row.TASK_COMMENTS + "'," + data.row.TASK_SEQ + ",'"+ data.row.TASK_ADDRESS+"'";
					pSQL += ", '"+ data.row.RELATED_CLIENT_PHONE_1 + "','" + data.row.EMAIL_TO_CONFIRM + "','"+data.row.RELATED_CLIENT_NAME+"',"+data.row.TASK_PRIORITY+",'"+data.row.TASK_STATUS+"')";
					console.log(pSQL);
					
					tx.executeSql(pSQL);

				},
				function (tx, err) { my_dialog("", "", "close"); notify(err); },
				function ()
				{
					//5709-3907 eleodoro chamele.
				}
			);
		}
	); 
	
	socket.on('getmypickupplan_completed', 
		function (data)
		{
			//RefreshMyRoutePlan();
		}
	); 
	
}
function delegate_socket_login()
{
    /* LOGIN */
    socket.on('invalid_credentials', function (data)
    {
        notify("Usuario o Password invalido");
    });
    socket.on('welcome_to_sonda', function (data)
    {
        my_dialog("", "", "close");
        
        gCurrentRoute = data.routeid;
        gLastLogin = pUserID;
        UpdateLoginInfo("set");
                
        if(gIsOnline===1){
			socket.emit('getmypickupplan',{'courierid': gLastLogin});
        }
		
        $.mobile.changePage("#menu_page", {
            transition: "flow",
            reverse: true,
            showLoadMsg: true
        });

    });
}

function delegate_socket_core()
{
    try
    {
        socket.on('connect', function () {
            try {

                $("#lblNetworkLogin").text(states[gNetworkState]);
                $('#lblNetworkLogin').buttonMarkup({ icon: "cloud" });
                
                $("#lblNetworkDeliveryMenu").text(states[gNetworkState]);
                $('#lblNetworkDeliveryMenu').buttonMarkup({ icon: "cloud" });
                    
                $("#lblNetworkDeliveryPickupPlan").text(states[gNetworkState]);
                $('#lblNetworkDeliveryPickupPlan').buttonMarkup({ icon: "cloud" });

                $("#lblNetworkTask").text(states[gNetworkState]);
                $('#lblNetworkTask').buttonMarkup({ icon: "cloud" });

                gIsOnline = 1;
                clearInterval(socketConnectTimeInterval);

                //CheckforOffline();

            } catch (e) {
                alert("error: " + e.message);
                console.log(e.message);
            }

        });
        socket.on('disconnect', function ()
        {
            $("#lblNetworkLogin").text("OFF");
            $('#lblNetworkLogin').buttonMarkup({ icon: "forbidden" });

            $("#lblNetworkDeliveryPickupPlan").text("OFF");
            $('#lblNetworkDeliveryPickupPlan').buttonMarkup({ icon: "forbidden" });

            $("#lblNetworkDeliveryMenu").text("OFF");
            $('#lblNetworkDeliveryMenu').buttonMarkup({ icon: "forbidden" });

            $("#lblNetworkTask").text("OFF");
            $('#lblNetworkTask').buttonMarkup({ icon: "forbidden" });

            socketConnectTimeInterval = setInterval(function ()
            {
                socket = io.connect(SondaServerURL);
                try
                {
                    if (socket.socket.connected) { clearInterval(socketConnectTimeInterval); }
                } catch (e) { }
                
            }, 10000);

            gIsOnline = 0;
        });
        socket.on('error_message', function (data)
        {
            notify(data.message);
        });
        socket.on('broadcast_receive', function (data)
        {
            navigator.geolocation.getCurrentPosition(
                function (position)
                {
                    gCurrentGPS = position.coords.latitude + ',' + position.coords.longitude;
                    socket.emit('broadcast_response', { 'sockeit': socket.id, 'gps': gCurrentGPS,'message:':'OK','routeid':gCurrentRoute,'loginid':gLastLogin });
                },
                function (error)
                {
                    socket.emit('broadcast_response', { 'sockeit': socket.id, 'gps': "0,0",'message:':error,'routeid':gCurrentRoute,'loginid':gLastLogin });
                }
                , { timeout: 30000, enableHighAccuracy: true }
            );
            //notify(data.message);
        });
        

    }catch(e)
    {
        notify("delegate_socket_core:" + e.message);
    }
   

}
