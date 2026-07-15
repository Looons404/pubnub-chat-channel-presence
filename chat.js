
// --------------------------------------------------------------------------
// 
// PubNub Channel Presence!
// 
// http://twitter.com/pubnub - let's be friends.
// 
// --------------------------------------------------------------------------


(function(){

var p               = PUBNUB
,   update_template = template('update-template')
,   person_template = template('person-template')
,   chat_template   = template('chat-message-template')
,   nowc            = function(){return+new Date-TOFFSET}
,   TOFFSET         = p.time(function(t){
        TOFFSET=(+new Date)-Math.ceil(+t/10000)
    })||1
,   NOW             = 1
,   UUID            = ''
,   channel         = 'pubnub-chat-demo-channel'
,   users           = JSON.parse(p.db.get(channel+'-users') || '{}')
,   time            = p.$('time')
,   online          = p.$('people-online');

// --------------------------------------------------------------------------
// 
// USERNAME LOGIN
// 
// --------------------------------------------------------------------------
var login_input = p.$('username-input');
var login_btn   = p.$('username-join');

function do_login() {
    var name = (login_input.value || '').trim().toLowerCase();
    if (!name) return;
    UUID = name;
    get_user({
        uuid     : UUID,
        callback : ready
    });
}

p.bind( 'click', login_btn, do_login );
p.bind( 'keyup', login_input, function(e) {
    (e.keyCode || e.charCode) === 13 && do_login();
});

// --------------------------------------------------------------------------
// 
// SET THE CURRENT USER'S PICTURE ON THE SEND BUTTON.
// 
// --------------------------------------------------------------------------
function set_current_user(user) {
    if (user.uuid !== UUID) return;
    p.css( p.$('chat-box-user-icon'), {
        'backgroundImage' : 'url('+user.profile_image_url_https+')'
    } );
}

// --------------------------------------------------------------------------
// 
// GET USER - creates a user object from the username directly
// 
// --------------------------------------------------------------------------
function get_user(args) {
    var uuid     = args.uuid
    ,   callback = args.callback;

    if (uuid in users) {
        // Always use GitHub avatar URL (derivable from username)
        users[uuid].profile_image_url_https = 'https://avatars.githubusercontent.com/' + uuid + '?s=40';
        p.db.set( channel+'-users', JSON.stringify(users) );
        return callback(users[uuid]);
    }

    var user = {
        uuid                   : uuid,
        name                   : uuid,
        profile_image_url_https : 'https://avatars.githubusercontent.com/' + uuid + '?s=40'
    };
    users[uuid] = user;
    p.db.set( channel+'-users', JSON.stringify(users) );
    callback(user);
}

// --------------------------------------------------------------------------
// 
// PEOPLE
// 
// --------------------------------------------------------------------------
var people = (function() {
    var people         = {}
    ,   list_of_people = p.$('list-of-people');

    function get_person_div(uuid) {
        return people[uuid] || (function(uuid){
            var person = p.create('div');

            list_of_people.insertBefore(
                person,
                first_div(list_of_people)
            );

            return (people[uuid] = person);
        })(uuid);
    }

    function online(user) {
        supplant( get_person_div(user.uuid), person_template, {
            bg     : user.profile_image_url_https || '#555',
            color  : '#2e3',
            name   : user.name,
            uuid   : user.uuid,
            status : 'online'
        } );
    }

    function offline(user) {
        supplant( get_person_div(user.uuid), person_template, {
            bg     : user.profile_image_url_https || '#555',
            color  : '#e42',
            name   : user.name,
            uuid   : user.uuid,
            status : 'offline'
        } );
    }

    return {
        online : function(uuid) {
            get_user({ uuid : uuid, callback : online });
        },
        offline : function(uuid) {
            get_user({ uuid : uuid, callback : offline });
        }
    };
})();

// --------------------------------------------------------------------------
// 
// UPDATES
// 
// --------------------------------------------------------------------------
var update = (function() {
    var updates     = []
    ,   update_area = p.$('update-area');

    return {
        add : function(args) {
            // Prevent Duplicate Events
            var previous = updates.slice(-1);
            previous = previous.length && previous[0];

            if (previous && (
                (previous.uuid + previous.message) ==
                (args.uuid + args.message)
            ) ) return;

            // Do nothing for a NULL UUID
            if (!args.uuid) return;

            var entry = p.create('div')
            ,   msg   = args.message
            ,   user  = get_user({
                uuid     : args.uuid,
                callback : function(user) {
                    supplant( entry, update_template, {
                        time    : time.innerHTML,
                        name    : user.name,
                        message : msg
                    } );

                    update_area.insertBefore(
                        entry,
                        first_div(update_area)
                    );
                }
            });

            updates.push(args);
        }
    };
})();

// --------------------------------------------------------------------------
// 
// TALK
// 
// --------------------------------------------------------------------------
var talk = (function() {
    var talk   = {}
    ,   output = p.$('talk-box-output');

    function message( user, message, args ) {
        sounds.play( 'chat' );

        var when       = args.time
        ,   no_animate = args.no_animate
        ,   clock      = args.clock || nowc();

        if (message_inline( user, message, when )) return;

        var entry = p.create('div');

        supplant( entry, chat_template, {
            name    : user.name,
            time    : when || time.innerHTML,
            clock   : clock,
            message : message
        } );

        p.css( entry, { overflow: 'hidden' } );

        if (!no_animate) animate( entry, [
            { d : 0.01, height : '1px', opacity : '0.4' }
        ] );

        output.insertBefore( entry, first_div(output) );

        var offset = first_div(entry).offsetHeight;
        if (!no_animate) animate( entry, [
            { d : 0.01, height : '1px',         opacity : '0.4' },
            { d : 0.4,  height : offset + 'px', opacity : '1.0' }
        ] );
    }

    function message_inline( user, message, when ) {
        var first_msg = first_div(output)
        ,   msg_line  = null;

        first_msg = first_msg && first_div(first_msg);

        if (!first_msg) return;

        var join = p.attr( first_msg, 'join' ) || 'none';

        p.each( first_msg.getElementsByTagName('div'), function(div) {
            if (p.attr( div, 'msg-line' )) msg_line = div;
        } );

        if (!msg_line) return;
        if (join != user.name + '-' + when) return;

        msg_line.innerHTML = message + '<br>' + msg_line.innerHTML;
        p.css( first_div(output), {height: first_msg.offsetHeight});

        return 1;
    }

    return {
        message : function(args) { get_user({
            uuid     : args.uuid,
            callback : function(user) { message(
                user,
                clean(args.message || ' '),
                args
            ) }
        }) }
    };
})();

// --------------------------------------------------------------------------
// 
// UTILITY FUNCTIONS
// 
// --------------------------------------------------------------------------
function first_div(elm) { return elm.getElementsByTagName('div')[0] }
function clean(text)    { return (''+text).replace( /[<>]/g, '' ) }
function template(id)   { return p.$(id).innerHTML }
function zeropad(num)   { return (''+num).length > 1 ? ''+num : '0'+num }
function hide(id)       { p.css( p.$(id), { display : 'none' } ) }
function supplant( d, t, o ) { d.innerHTML = p.supplant( t, o ) }

// --------------------------------------------------------------------------
// 
// CHAT BIND CONTROL
// 
// --------------------------------------------------------------------------
(function(){
    var input  = p.$('chat-input')
    ,   button = p.$('chat-button');

    function send() {
        if (!input.value || !UUID) return;
        return p.publish({
            channel : channel,
            message : {
                uuid  : UUID,
                body  : clean(input.value),
                time  : time.innerHTML,
                clock : nowc()
            },
            x : (input.value='')
        });
    }

    p.bind( 'touchstart,mousedown', button, send );
    p.bind( 'keyup', input, function(e) {
       (e.keyCode || e.charCode) === 13 && send();
    });
})();

// --------------------------------------------------------------------------
// 
// READY FUNCTION
// 
// --------------------------------------------------------------------------
function ready(user) {
    hide('overlay');
    hide('username-login');

    set_current_user(user);

    // Setup Connection Based on User Data
    // This will provide Connectivity References
    p = p.init({
        publish_key   : 'YOUR_PUBLISH_KEY',
        subscribe_key : 'YOUR_SUBSCRIBE_KEY',
        ssl           : true,
        cipher_key    : '',
        uuid          : ''+user.uuid
    });

    // History of Past Posted Messages
    // This will Provide a Buffer of Messages Sent in the Past.
    p.history({
        channel  : channel,
        limit    : 10,
        callback : function(messages) {
            p.each( messages.sort(function( a, b ){
                return+a.clock - +b.clock;
            }), function(message) {
                talk.message({
                    uuid       : message.uuid,
                    message    : message.body,
                    time       : message.time,
                    no_animate : true
                });
            } );
        }
    });

    // This event Fires when a new User has Joined.
    p.events.bind( 'presence-user-join', function(uuid) {
        update.add({ uuid : uuid, message : 'Joined' });
        people.online(uuid);
    } );

    // This event Fires when a new User has Left.
    p.events.bind( 'presence-user-leave', function(uuid) {
        update.add({ uuid : uuid, message : 'Left' });
        people.offline(uuid);
    } );

    // The State of User Occupancy has Changed.
    // This Function is Called when Someone Joins/Leaves.
    function presence(details) {
        var uuid = 'uuid' in details && (''+details.uuid).toLowerCase();

        if ('action' in details && uuid) p.events.fire(
            'presence-user-' + details.action, uuid
        );

        // Here Now (only)
        if ('uuids' in details) p.each( details.uuids, function(uuid) {
            p.events.fire( 'presence-user-join', uuid.toLowerCase() );
        } );

        // Here Now (too)
        online.innerHTML = 'occupancy' in details && details.occupancy || 1;
    }

    // A new message!
    // This Function is Called when Someone Chats.
    function chat(message) {
        // Append Chat Message
        talk.message({
            uuid    : message.uuid,
            message : message.body,
            time    : message.time
        });
    }

    // Get List of Occupants
    // This FUNCTION is Called on Established Connection.
    function connect() {
        p.here_now({
            channel  : channel,
            callback : presence
        });
    }

    // Open Bidirectional Socket Connection
    p.subscribe({
        restore  : true,
        channel  : channel,
        connect  : connect,
        callback : chat,
        presence : presence
    });
}

// --------------------------------------------------------------------------
// 
// BIG CLOCK
// 
// --------------------------------------------------------------------------
function update_time() {
    var now = new Date()
    ,   min = now.getMinutes()
    ,   hrs = now.getHours();

    supplant( time, '{hours}:{minutes}<sup>{pmam}</sup>', {
        hours   : zeropad(hrs > 12 ? (hrs - 12) || 1 : hrs || 1),
        minutes : zeropad(min),
        pmam    : hrs > 11 ? 'pm' : 'am'
    } );
}
setInterval( update_time, 1000 );
update_time();

})();
