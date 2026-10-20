"""Wrap out/cover-300dpi.png in a PDF page of the exact KDP cover size."""
import os
import re

from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
with open(os.path.join(OUT, "specs.txt")) as fh:
    specs = fh.read()
w_in, h_in = map(float, re.search(r"Cover size.*?: ([\d.]+) x ([\d.]+)", specs).groups())
c = canvas.Canvas(os.path.join(OUT, "cover.pdf"), pagesize=(w_in * 72, h_in * 72))
c.drawImage(ImageReader(os.path.join(OUT, "cover-300dpi.png")), 0, 0, w_in * 72, h_in * 72)
c.save()
print(f"cover.pdf {w_in} x {h_in} in")
