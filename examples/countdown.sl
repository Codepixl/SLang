#Basically a demo of methods.

:["print" #Prints the current num
	:P
]:

:["countdown" #Counts down from current num, recursively.
	;{ #if statement
		;)"print"
		D:
		;)"countdown"
	};
]:

:D :D :D :D :D :D :D ;)"countdown"
