@builtin "whitespace.ne"

number -> "(" _ ((variable _):? ([^)] | "\\)"):*) _ ")"
degrees -> "(" _ "@" _ ((variable _):? ([^)] | "\\)"):*) _ ")"
writeable -> "(" _ [vV^] _ [_$a-zA-Z] [_$a-zA-Z0-9]:* _ ((variable _):? ([^)] | "\\)"):*) _ ")"
string -> "[" _ ((variable _):? ([^\]] | "\\]"):*) _ "]"
list -> "[" _ [vV^] _ [_$a-zA-Z] [_$a-zA-Z0-9]:* _ ((variable _):? ([^\]] | "\\)"):*) _ "]"
collapse -> "[" _ [<>] _ argument:* _ "]"
boolean -> "<" _ ">"
stack -> "{" _ "}"
icon -> "@" _ [_$a-zA-Z] [_$a-zA-Z0-9]:*
variable -> "$" _ [_$a-zA-Z] [_$a-zA-Z0-9]:*
argument -> number | writeable | string | list | degrees | .:+
block -> _ argument:* _ "::" (_ [^\s]:*):*

category -> _ "#" _ [^\n]:* _ ":"
iconDefinition -> _ "@" _ [_$a-zA-Z] [_$a-zA-Z0-9]:* _ "=" _ [^\n]:*
listDefinition -> _ [vV^] _ [_$a-zA-Z] [_$a-zA-Z0-9]:* _ "{" _ (([^,] | "\\,"):* _ "," _):* _ "}"

main -> ((iconDefinition | listDefinition) | category _ ((iconDefinition | listDefinition | block) _):*):*