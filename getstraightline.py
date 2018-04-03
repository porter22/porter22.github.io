import numpy as np
import pylab
import csv
Polynomial = np.polynomial.Polynomial

# The data: conc = [P] and absorbance, A
conc = np.array([0, 20, 40, 80, 120, 180, 260, 400, 800, 1500])
A = np.array([2.287, 3.528, 4.336, 6.909, 8.274, 12.855, 16.085, 24.797,
              49.058, 89.400])

with open('marathon_times_men_minutes.csv', 'rb') as f:
    reader = csv.reader(f)
    mylist = list(reader)

time = []
years = []
i = 0

for item in mylist:
    if i == 0:
        i = 1
        continue
    else:
        time.append(float(item[1]))
        years.append(float(item[4]))
    print (item[1], item[4])

#cmin, cmax = min(conc), max(conc)
cmin, cmax = min(years), max(years)
pfit, stats = Polynomial.fit(years, time, 1, full=True, window=(cmin, cmax),
                                                    domain=(cmin, cmax))

print('Raw fit results:', pfit)


print('Raw fit stats:', stats)


A0, m = pfit
resid, rank, sing_val, rcond = stats
rms = np.sqrt(resid[0]/len(time))

print('Fit: time = {:.3f}[years] + {:.3f}'.format(m, A0),
      '(rms residual = {:.4f})'.format(rms))
