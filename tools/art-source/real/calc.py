import math
hc_eVm = 1.239841984e-6      # h c in eV m
hbarc_GeVm = 1.973269804e-16 # hbar c in GeV m
def wl(E_eV): return hc_eVm / E_eV
def red(E_GeV): return hbarc_GeVm / E_GeV
items = [
 (17,'SLAC electrons 17 GeV, wavelength h c/E',       wl(17e9)),
 (18,'W boson reach hbar/(m c), 80.37 GeV',            red(80.37)),
 (19,'LIGO GW150914 strain 1e-21 x 4000 m',            1.0e-21*4000),
 (20,'LHC 13.6 TeV wavelength h c/E',                  wl(13.6e12)),
 (20,'quark size limit (Wikipedia, <1e-4 proton dia 1.7 fm)', 1e-4*1.7e-15),
 (21,'LHAASO 100 TeV photon wavelength',               wl(1e14)),
 (22,'LHAASO 1.4 PeV photon wavelength',               wl(1.4e15)),
 (23,'electron radius limit (Penning trap)',           1e-22),
 (24,'KM3NeT 220 PeV neutrino wavelength',             wl(220e15)),
 (25,'UHECR 1 EeV wavelength',                         wl(1e18)),
 (26,'Auger dipole threshold 8 EeV wavelength',        wl(8e18)),
 (27,'GZK 5e19 eV wavelength',                         wl(5e19)),
 (28,'OMG 3.2e20 eV wavelength',                       wl(3.2e20)),
 (28,'Amaterasu 2.4e20 eV wavelength',                 wl(2.4e20)),
 (29,'neutron EDM 1.8e-26 e cm -> metres',             1.8e-26*1e-2),
 (30,'electron EDM Tl 2002 1.6e-27 e cm',              1.6e-27*1e-2),
 (30,'electron EDM YbF 2011 1.06e-27 e cm',            1.06e-27*1e-2),
 (31,'electron EDM ACME I 2014 8.7e-29 e cm',          8.7e-29*1e-2),
 (32,'electron EDM ACME II 2018 1.1e-29 e cm',         1.1e-29*1e-2),
 (33,'electron EDM JILA 2023 4.1e-30 e cm',            4.1e-30*1e-2),
 (34,'H.E.S.S. 2008 E_QG > 7.2e17 GeV -> length',      red(7.2e17)),
 (35,'Fermi 2009 M_QG > 1.19 M_Planck -> length',      1.616255e-35/1.19),
 (36,'Planck length',                                  1.616255e-35),
]
for n,name,X in items:
    S = 1.7 / 10**(n-1); lo = S/10
    ratio = X/S
    inrange = lo <= X <= S
    print('w%-2d S=%.2e  X=%.2e  X/S=%.2f  in world range=%s | %s' % (n,S,X,ratio,inrange,name))
