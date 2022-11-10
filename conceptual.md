current problems. TWO PROBLEMS

ONE
CANNOT SELECT WHERE '%$1%'

must be WHERE name ILIKE $1
and in paramaterization do the percents ['% name %']

TWO
second problme. "currentIdx" not being manipulated, not incrementing

we saw

WHERE name ILIKE $1, num_employees >= $1
