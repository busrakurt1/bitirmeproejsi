import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  /**
   * CV'yi ATS uyumlu PDF'e dönüştürür.
   * - HTML2Canvas ile görüntü tabanlı PDF (Türkçe karakter desteği)
   * - Yüksek kalite ve ATS uyumluluğu
   * - A4 boyutuna göre formatlar
   * @param {Object} user - Kullanıcı verileri (Dosya ismi için)
   * @param {string} elementId - Dönüştürülecek HTML elementinin ID'si
   */
  static async generateCVPDF(user, elementId = 'cv-preview') {
    try {
      console.log('📄 ATS uyumlu PDF oluşturuluyor...');

      const element = document.getElementById(elementId);
      if (!element) throw new Error('CV elementi bulunamadı!');

      // 1. ADIM: KLONLAMA VE TEMİZLİK
      const clone = element.cloneNode(true);
      
      // PDF'te görünmemesi gereken buton/alanları temizle
      clone.querySelectorAll('.pdf-exclude').forEach(el => el.remove());

      // 2. ADIM: GÖRÜNMEZ KONTEYNER (RENDER ALANI)
      const A4_WIDTH_PX = 794; 
      const container = document.createElement('div');
      
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = Math.max(element.offsetWidth, A4_WIDTH_PX) + 'px';
      container.style.visibility = 'visible';
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';
      
      container.appendChild(clone);
      document.body.appendChild(container);

      try {
        // 3. ADIM: ASSET YÜKLEME BEKLEMELERİ
        await new Promise(resolve => setTimeout(resolve, 200));

        // Fontların hazır olmasını bekle
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        // Tüm resimlerin yüklendiğinden emin ol
        const imgs = Array.from(clone.querySelectorAll('img'));
        if (imgs.length > 0) {
          await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 3000);
            });
          }));
        }

        // 4. ADIM: HTML2CANVAS İLE GÖRÜNTÜ ALMA (Yüksek kalite)
        const canvas = await html2canvas(clone, {
          scale: 2, // Retina kalitesi
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: container.scrollWidth,
          windowHeight: container.scrollHeight,
          allowTaint: false,
          removeContainer: false
        });

        // 5. ADIM: PDF OLUŞTURMA
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        // Canvas piksellerini PDF milimetresine çevirme
        const outputScale = pdfWidth / canvas.width;
        const imgHeightInPDF = canvas.height * outputScale;
        
        // Sayfalama
        let heightLeft = imgHeightInPDF;
        let position = 0;

        // İlk sayfayı bas
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
        heightLeft -= pdfHeight;

        // Taşma varsa yeni sayfalar ekle
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
          heightLeft -= pdfHeight;
        }

        // 6. ADIM: LİNKLERİ EKLEME
        const links = clone.querySelectorAll('a[href]');
        const cloneRect = clone.getBoundingClientRect();

        links.forEach(link => {
          const linkRect = link.getBoundingClientRect();
          const relativeX_Px = linkRect.left - cloneRect.left;
          const relativeY_Px = linkRect.top - cloneRect.top;
          const w_Px = linkRect.width;
          const h_Px = linkRect.height;
          
          const domScaleFactor = pdfWidth / clone.offsetWidth;
          const pdfX = relativeX_Px * domScaleFactor;
          const pdfY = relativeY_Px * domScaleFactor;
          const pdfW = w_Px * domScaleFactor;
          const pdfH = h_Px * domScaleFactor;
          
          const linkPageNumber = Math.floor(pdfY / pdfHeight) + 1;
          const linkYOnPage = pdfY - ((linkPageNumber - 1) * pdfHeight);

          if (linkPageNumber <= pdf.getNumberOfPages()) {
            pdf.setPage(linkPageNumber);
            pdf.link(pdfX, linkYOnPage, pdfW, pdfH, { url: link.href });
          }
        });

        // 7. ADIM: KAYDETME
        const safeName = (user?.fullName || 'CV').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        pdf.save(`${safeName}_ATS_CV.pdf`);
        
        console.log(`✅ ATS uyumlu PDF başarıyla oluşturuldu (${links.length} link eklendi).`);

      } finally {
        // Temizlik
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }

    } catch (error) {
      console.error('❌ PDF Oluşturma Hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
  }
}

export default PDFService;