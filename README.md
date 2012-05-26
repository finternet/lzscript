lzscript
========

This is another lazy script loader. Why you need another lazy script loader? Well, you don't need it, but we need it :) so we made it and now sharing it with you. Who knows, maybe it will help you also.

What lzscript does?
===================

**lzscript** loads scripts whenever it is required, without blocking your content/images/css files being downloaded by browser. So theorically it will boost your website, but it depends how you are using it. The idea is, you will include the lzscript in your webpage's header, and then you will use lzscript to load your other javascript files, whenever required.

How to use?
===========

It is simple, but not that much as you might think :)
* First you will include lzscript in the header of the page:
	<script src="lzscript.js" type="text/javascript"></script>
* Now if you need to add a code that requires jQuery, then you can do something like:
	<script type="text/javascript">
		lzscript.requireAndDefine('jquery').requires('jquery').define('whateveryouwant', function(){
			// this is so ugly
			// you jQuery code goes here
		});
	</script>

You might think why you need all of this, well the first function call tells lzscript to load jquery, and mark it as defined, the second function *requires* says that our define functions should not execute unless jquery has been loaded and defined. Once jQuery has been loaded, system will call the define function and your code will run.

* Your code can get even more nasty:
	<script type="text/javascript">
		lzscript.requireAndDefine('jquery','mustache').requires('jquery','mustache').define('whateveryouwant', function(){
			// this is so ugly
			// you jQuery code goes here
		});
	</script>

This means you can pass more than one resource name to *requires* or *requireAndDefine* method. Also you can chain those. But once you added *define* method, the chain will end.

* One last thing, how system loads those resources? whatever resource name you will put, system will add a **.js** extension to it, then it will append it to the end of **basePath** and that's it. If you need to change the basePath, you can use following function call:
	<script type="text/javascript">
		lzscript.path('/scripts/');
	</script>

So then the xyz script will be loaded from '/scripts/xyz.js'.

* If you want to load from an external url (e.g. Google CDN, Facebook JS script, etc.), then you can use the **get** method:
	<script type="text/javascript">
		lzscript.get('http://xyz.com/scripts/myscript.js', 'myscript');
	</script>

Note that the second parameter is the name that will be used by other scripts to reference the loaded script (You don't want to put the whole URL in **requires** calls. What if URL changed?).