/**
 * User: Alexander
 * Date: 12.01.12
 * Time: 21:36
 */
$(document).ready(function() {
    $('#submit').click(function() {
        var action = $('#action').val();
        var voice = $('#voice').val();
        var music = $('#music').val();
        var text = $('#text').val();
        var bg = $('#bg').val();
        var newscreen = $('#newscreen').val();
        var sprites = $('#sprites').val();
        var bgcolor = $('#bgcolor').val();
        var sound = $('#sound').val();
        var history = $('#history').val();
        var links = $('#links').val();
        $('#submit').val('sending...');
        $('#submit').attr('disabled', 'disabled');
        $.ajax({
            url: 'api.php?send=1',
            dataType: 'json',
            data: {action: action, voice: voice, music: music, text: text, bg: bg,
                newscreen: newscreen, sprites: sprites, bgcolor: bgcolor,
                sound: sound, history: history, links: links },
            success: function(data) {
                if (data) {
                    $('#action').val(parseInt(action, 10) + 1);
                    $('#voice').val('');
                    $('#music').val(music);
                    $('#text').val('');
                    $('#bg').val(bg);
                    $('#sprites').val('');
                    $('#bgcolor').val('');
                    $('#sound').val('');
                    $('#history').val(history);
                    $('#links').val('');
                    $('#submit').val('Send');
                    $('#submit').removeAttr("disabled");
                }
            }
        });
    });
});