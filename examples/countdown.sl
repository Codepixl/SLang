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

XD ;D :D #Add 26

;)"countdown" #Call countdown
