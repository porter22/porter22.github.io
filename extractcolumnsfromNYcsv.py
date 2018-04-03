import csv
import pandas
data = pandas.read_csv("NYPD_Complaint_Data_Historic.csv", usecols=[1,3])

'''
def time_to_minutes(mylist):
    index = 0
    minutes = 0
    for item in mylist:
        if index > 0:
            print item[3]
            timestr = str(item[3])
            h,m,s = timestr.split(':')
            minutes = int(h)*60 + int(m) + int(s)/60
            print minutes
            item[3] = minutes
        index = index + 1
    return mylist

with open('marathon_times_men.csv', 'rb') as f:
    reader = csv.reader(f)
    mylist = list(reader)
    print mylist
    mylist = time_to_minutes(mylist)

result = ""
for item in mylist:
    result = result + str("male," + item[0]) + "," + str(item[1]) + "," + str(item[2]) + "," + str(item[3]) + "\n"
print result

with open("marathon_times_men_minutes.csv", "a") as text_file:
        text_file.write(result)
'''
